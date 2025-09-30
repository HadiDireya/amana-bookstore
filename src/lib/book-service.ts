import type { Collection, Filter } from 'mongodb';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import clientPromise from './mongodb';
import { Book, Review } from '@/app/types';

export const DB_NAME = process.env.MONGODB_DB || 'amana_bookstore';
export const BOOKS_COLLECTION = process.env.MONGODB_BOOKS_COLLECTION || 'books';
export const REVIEWS_COLLECTION = process.env.MONGODB_REVIEWS_COLLECTION || 'reviews';

type BookDocument = Partial<Omit<Book, 'id'>> & {
  id?: string | number;
  _id?: string | number | ObjectId;
};

type ReviewDocument = Review & { _id?: string };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function toNumericId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(typeof value === 'string' ? value : String(value ?? ''));
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`Invalid book id value: ${String(value)}`);
  }
  return parsed;
}

function toBookId(value: unknown): string {
  if (value === null || value === undefined) {
    throw new Error('Book id is missing');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
    throw new Error('Book id must not be empty');
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  const stringified = String(value);
  if (!stringified || stringified === '[object Object]') {
    throw new Error(`Invalid book id value: ${String(value)}`);
  }
  return stringified;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === 'string' && value.trim()) {
      return [value.trim()];
    }
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
    .filter(Boolean);
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return fallback;
}

function normalizeBook(doc: BookDocument): Book {
  const { _id, id, ...rest } = doc;
  const bookId = toBookId(id ?? _id);

  return {
    ...rest,
    id: bookId,
    title: typeof rest.title === 'string' ? rest.title : '',
    author: typeof rest.author === 'string' ? rest.author : '',
    description: typeof rest.description === 'string' ? rest.description : '',
    price: typeof rest.price === 'number' ? rest.price : Number(rest.price) || 0,
    image: typeof rest.image === 'string' ? rest.image : '',
    isbn: typeof rest.isbn === 'string' ? rest.isbn : '',
    genre: normalizeStringArray(rest.genre),
    tags: normalizeStringArray(rest.tags),
    datePublished: typeof rest.datePublished === 'string' ? rest.datePublished : '',
    pages: typeof rest.pages === 'number' ? rest.pages : Number(rest.pages) || 0,
    language: typeof rest.language === 'string' ? rest.language : '',
    publisher: typeof rest.publisher === 'string' ? rest.publisher : '',
    rating: typeof rest.rating === 'number' ? rest.rating : Number(rest.rating) || 0,
    reviewCount: typeof rest.reviewCount === 'number' ? rest.reviewCount : Number(rest.reviewCount) || 0,
    inStock: normalizeBoolean(rest.inStock),
    featured: normalizeBoolean(rest.featured),
  } satisfies Book;
}

function normalizeBookSafely(doc: BookDocument): Book | null {
  try {
    return normalizeBook(doc);
  } catch (err) {
    console.error('Skipping invalid book document', err);
    return null;
  }
}

function stripMongoId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

function buildBookIdQuery(ids: Array<string | number>): Filter<BookDocument> | null {
  if (ids.length === 0) {
    return null;
  }

  const idCandidates = new Set<string | number>();
  const objectIdCandidates = new Set<string>();

  ids.forEach((value) => {
    const stringValue = String(value);
    idCandidates.add(stringValue);

    const numeric = Number(stringValue);
    if (Number.isFinite(numeric)) {
      idCandidates.add(numeric);
    }

    if (ObjectId.isValid(stringValue)) {
      try {
        objectIdCandidates.add(new ObjectId(stringValue).toHexString());
      } catch {
        // ignore invalid conversions
      }
    }
  });

  const orConditions: Filter<BookDocument>[] = [];

  const idValues = Array.from(idCandidates);
  if (idValues.length > 0) {
    orConditions.push({ id: { $in: idValues } });
    orConditions.push({ _id: { $in: idValues } });
  }

  const objectIds = Array.from(objectIdCandidates).map((hex) => new ObjectId(hex));
  if (objectIds.length > 0) {
    orConditions.push({ _id: { $in: objectIds } });
  }

  if (orConditions.length === 0) {
    return null;
  }

  if (orConditions.length === 1) {
    return orConditions[0];
  }

  return { $or: orConditions };
}

export async function fetchAllBooks(): Promise<Book[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const docs = await db.collection<BookDocument>(BOOKS_COLLECTION).find({}).toArray();
  return docs
    .map(normalizeBookSafely)
    .filter((book): book is Book => book !== null);
}

export async function fetchBookById(id: string | number): Promise<Book | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<BookDocument>(BOOKS_COLLECTION);

  const query = buildBookIdQuery([id]);
  if (!query) {
    return null;
  }

  const doc = await collection.findOne(query);
  return doc ? normalizeBookSafely(doc) : null;
}

export async function fetchBooksByIds(ids: Array<string | number>): Promise<Book[]> {
  if (ids.length === 0) {
    return [];
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<BookDocument>(BOOKS_COLLECTION);

  const query = buildBookIdQuery(ids);
  if (!query) {
    return [];
  }

  const docs = await collection.find(query).toArray();
  const books = docs.map(normalizeBookSafely).filter((book): book is Book => book !== null);
  const booksById = new Map(books.map((book) => [String(book.id), book]));

  const ordered: Book[] = [];
  ids.forEach((bookId) => {
    const match = booksById.get(String(bookId));
    if (match) {
      ordered.push(match);
    }
  });

  return ordered;
}

export async function fetchReviewsForBook(bookId: string): Promise<Review[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ReviewDocument>(REVIEWS_COLLECTION);
  const docs = await collection.find({ bookId }).sort({ timestamp: -1 }).toArray();
  return docs.map((doc) => stripMongoId(doc) as Review);
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
  const docs = await collection.find({}, { projection: { id: 1, _id: 1 } }).toArray();
  const maxId = docs.reduce((max, doc) => {
    const candidate = doc.id ?? doc._id;
    if (candidate === undefined) {
      return max;
    }
    try {
      const numeric = toNumericId(candidate);
      return Math.max(max, numeric);
    } catch {
      return max;
    }
  }, 0);
  return maxId + 1;
}

export async function createBook(payload: CreateBookInput): Promise<Book> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<BookDocument>(BOOKS_COLLECTION);

  const numericId = payload.id !== undefined ? toNumericId(payload.id) : await getNextNumericBookId(collection);
  const bookId = String(numericId);

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
      { isbn },
    ],
  });
  if (existing) {
    throw new ValidationError('Book with the same id or ISBN already exists');
  }

  const book: Book = {
    id: bookId,
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
  const db = client.db(DB_NAME);
  const reviewsCollection = db.collection<ReviewDocument>(REVIEWS_COLLECTION);
  const booksCollection = db.collection<BookDocument>(BOOKS_COLLECTION);

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
    .map((doc) => stripMongoId(doc) as Review);

  const totalReviews = normalizedReviews.length;
  const averageRating = totalReviews === 0
    ? 0
    : Number((normalizedReviews.reduce((sum, current) => sum + current.rating, 0) / totalReviews).toFixed(1));

  const updateFilter = buildBookIdQuery([book.id]);
  if (updateFilter) {
    await booksCollection.updateOne(
      updateFilter,
      {
        $set: {
          reviewCount: totalReviews,
          rating: averageRating,
        },
      },
    );
  }

  return review;
}
