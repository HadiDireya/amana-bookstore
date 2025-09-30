import type { Collection } from 'mongodb';
import { randomUUID } from 'crypto';
import clientPromise from './mongodb';
import { Book, Review } from '@/app/types';

const DB_NAME = process.env.MONGODB_DB || 'amana_bookstore';
const BOOKS_COLLECTION = process.env.MONGODB_BOOKS_COLLECTION || 'books';
const REVIEWS_COLLECTION = process.env.MONGODB_REVIEWS_COLLECTION || 'reviews';

type BookDocument = Partial<Omit<Book, 'id'>> & {
  id?: string | number;
  _id?: string | number;
};

type ReviewDocument = Review & { _id?: string };

function toNumericId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(typeof value === 'string' ? value : String(value ?? ''));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid book id value: ${String(value)}`);
  }
  return parsed;
}

function normalizeBook(doc: BookDocument): Book {
  const { _id, id, ...rest } = doc;
  void _id;

  const numericId = toNumericId(id ?? _id);

  return {
    ...rest,
    id: numericId,
    title: rest.title ?? '',
    author: rest.author ?? '',
    description: rest.description ?? '',
    price: rest.price ?? 0,
    image: rest.image ?? '',
    isbn: rest.isbn ?? '',
    genre: rest.genre ?? [],
    tags: rest.tags ?? [],
    datePublished: rest.datePublished ?? '',
    pages: rest.pages ?? 0,
    language: rest.language ?? '',
    publisher: rest.publisher ?? '',
    rating: rest.rating ?? 0,
    reviewCount: rest.reviewCount ?? 0,
    inStock: rest.inStock ?? false,
    featured: rest.featured ?? false,
  } as Book;
}

function stripMongoId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

export async function fetchAllBooks(): Promise<Book[]> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookDocument>(BOOKS_COLLECTION);
  const docs = await collection.find({}).toArray();
  return docs.map(normalizeBook);
}

export async function fetchBookById(id: string | number): Promise<Book | null> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookDocument>(BOOKS_COLLECTION);

  const numericId = Number(id);
  const candidates = [id, String(id)];
  if (Number.isFinite(numericId)) {
    candidates.push(numericId);
  }

  const doc = await collection.findOne({ id: { $in: candidates } });
  return doc ? normalizeBook(doc) : null;
}

export async function fetchBooksByIds(ids: Array<string | number>): Promise<Book[]> {
  if (ids.length === 0) {
    return [];
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookDocument>(BOOKS_COLLECTION);

  const candidates = ids.flatMap((value) => {
    const numeric = Number(value);
    return [value, String(value), Number.isFinite(numeric) ? numeric : undefined].filter(
      (candidate): candidate is string | number => candidate !== undefined,
    );
  });

  const docs = await collection.find({ id: { $in: candidates } }).toArray();
  return docs.map(normalizeBook);
}

export async function fetchReviewsForBook(bookId: string): Promise<Review[]> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<ReviewDocument>(REVIEWS_COLLECTION);
  const docs = await collection.find({ bookId }).sort({ timestamp: -1 }).toArray();
  return docs.map(doc => stripMongoId(doc) as Review);
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface CreateBookInput extends Partial<Omit<Book, 'id'>> {
  id?: string | number;
}

export interface CreateReviewInput extends Partial<Omit<Review, 'id' | 'bookId' | 'timestamp'>> {
  id?: string;
  bookId: string | number;
  timestamp?: string;
}

function ensureNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(`${field} must not be empty`);
  }
  return trimmed;
}

function ensureStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty array of strings`);
  }
  const normalized = value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new ValidationError(`${field}[${index}] must be a string`);
    }
    const trimmed = item.trim();
    if (!trimmed) {
      throw new ValidationError(`${field}[${index}] must not be empty`);
    }
    return trimmed;
  });
  return normalized;
}

function ensureNumber(value: unknown, field: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new ValidationError(`${field} must be a valid number`);
  }
  return numberValue;
}

function ensureBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  throw new ValidationError(`${field} must be a boolean`);
}

function ensureRating(value: unknown, field: string): number {
  const rating = ensureNumber(value, field);
  if (rating < 0 || rating > 5) {
    throw new ValidationError(`${field} must be between 0 and 5`);
  }
  return rating;
}

function ensureTimestamp(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  throw new ValidationError(`${field} must be a valid ISO timestamp`);
}

async function getNextNumericBookId(collection: Collection<BookDocument>): Promise<number> {
  const docs = await collection.find({}, { projection: { id: 1 } }).toArray();
  const maxId = docs.reduce((max, doc) => {
    try {
      const numeric = toNumericId(doc.id ?? doc._id);
      return Math.max(max, numeric);
    } catch {
      return max;
    }
  }, 0);
  return maxId + 1;
}

export async function createBook(payload: CreateBookInput): Promise<Book> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookDocument>(BOOKS_COLLECTION);

  const numericId = payload.id !== undefined ? toNumericId(payload.id) : await getNextNumericBookId(collection);

  const title = ensureNonEmptyString(payload.title, 'title');
  const author = ensureNonEmptyString(payload.author, 'author');
  const description = ensureNonEmptyString(payload.description, 'description');
  const image = ensureNonEmptyString(payload.image, 'image');
  const isbn = ensureNonEmptyString(payload.isbn, 'isbn');
  const genre = ensureStringArray(payload.genre, 'genre');
  const tags = ensureStringArray(payload.tags, 'tags');
  const datePublished = ensureNonEmptyString(payload.datePublished, 'datePublished');
  const language = ensureNonEmptyString(payload.language, 'language');
  const publisher = ensureNonEmptyString(payload.publisher, 'publisher');

  const price = ensureNumber(payload.price, 'price');
  const pages = ensureNumber(payload.pages, 'pages');
  const rating = ensureNumber(payload.rating, 'rating');
  const reviewCount = ensureNumber(payload.reviewCount, 'reviewCount');
  const inStock = ensureBoolean(payload.inStock, 'inStock');
  const featured = ensureBoolean(payload.featured, 'featured');

  const existing = await collection.findOne({
    $or: [
      { id: numericId },
      { id: String(numericId) },
      { isbn }
    ],
  });
  if (existing) {
    throw new ValidationError('Book with the same id or ISBN already exists');
  }

  const book: Book = {
    id: numericId,
    title,
    author,
    description,
    price,
    image,
    isbn,
    genre,
    tags,
    datePublished,
    pages,
    language,
    publisher,
    rating,
    reviewCount,
    inStock,
    featured,
  };

  await collection.insertOne({ ...book, _id: numericId });
  return book;
}

export async function createReview(payload: CreateReviewInput): Promise<Review> {
  const { bookId } = payload;
  if (bookId === undefined || bookId === null) {
    throw new ValidationError('bookId is required');
  }

  const book = await fetchBookById(bookId);
  if (!book) {
    throw new ValidationError('Book not found');
  }

  const client = await clientPromise;
  const reviewsCollection = client.db(DB_NAME).collection<ReviewDocument>(REVIEWS_COLLECTION);
  const booksCollection = client.db(DB_NAME).collection<BookDocument>(BOOKS_COLLECTION);

  const reviewId = payload.id ? ensureNonEmptyString(payload.id, 'id') : `review-${randomUUID()}`;

  const review: Review = {
    id: reviewId,
    bookId: String(book.id),
    author: ensureNonEmptyString(payload.author, 'author'),
    rating: ensureRating(payload.rating, 'rating'),
    title: ensureNonEmptyString(payload.title, 'title'),
    comment: ensureNonEmptyString(payload.comment, 'comment'),
    timestamp: ensureTimestamp(payload.timestamp, 'timestamp'),
    verified: payload.verified !== undefined ? ensureBoolean(payload.verified, 'verified') : false,
  };

  const existingReview = await reviewsCollection.findOne({ id: review.id });
  if (existingReview) {
    throw new ValidationError('Review with the same id already exists');
  }

  await reviewsCollection.insertOne({ ...review, _id: review.id });

  const normalizedReviews = (await reviewsCollection.find({ bookId: review.bookId }).toArray())
    .map(doc => stripMongoId(doc) as Review);

  const totalReviews = normalizedReviews.length;
  const averageRating = totalReviews === 0
    ? 0
    : Number((normalizedReviews.reduce((sum, current) => sum + current.rating, 0) / totalReviews).toFixed(1));

  await booksCollection.updateOne(
    { id: { $in: [book.id, String(book.id)] } },
    {
      $set: {
        reviewCount: totalReviews,
        rating: averageRating,
      },
    },
  );

  return review;
}
