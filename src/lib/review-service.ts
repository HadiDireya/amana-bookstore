import { randomUUID } from 'crypto';
import clientPromise from './mongodb';
import { ValidationError } from './book-service';
import { Review } from '@/app/types';

export const DB_NAME = process.env.MONGODB_DB || 'amana_bookstore';
export const REVIEWS_COLLECTION = process.env.MONGODB_REVIEWS_COLLECTION || 'reviews';

type ReviewDocument = Review & { _id?: string };

export interface CreateReviewInput extends Partial<Omit<Review, 'id' | 'timestamp' | 'bookId'>> {
  id?: string;
  bookId: string;
  timestamp?: string;
}

function stripMongoId(doc: ReviewDocument): Review {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
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

function ensureRating(value: unknown, field: string): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 5) {
    throw new ValidationError(`${field} must be a number between 0 and 5`);
  }
  return numeric;
}

function ensureTimestamp(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  throw new ValidationError('timestamp must be a valid ISO date string');
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

function normalizeReview(doc: ReviewDocument): Review {
  const normalized = stripMongoId(doc);
  const verified = normalized.verified !== undefined ? ensureBoolean(normalized.verified, 'verified') : false;
  const timestamp = typeof normalized.timestamp === 'string'
    ? ensureTimestamp(normalized.timestamp)
    : ensureTimestamp(undefined);
  return {
    ...normalized,
    id: ensureNonEmptyString(normalized.id, 'id'),
    bookId: ensureNonEmptyString(normalized.bookId, 'bookId'),
    author: ensureNonEmptyString(normalized.author, 'author'),
    rating: ensureRating(normalized.rating, 'rating'),
    title: ensureNonEmptyString(normalized.title, 'title'),
    comment: ensureNonEmptyString(normalized.comment, 'comment'),
    timestamp,
    verified,
  } satisfies Review;
}

export async function fetchReviewsByBookId(bookId: string): Promise<Review[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ReviewDocument>(REVIEWS_COLLECTION);
  const docs = await collection.find({ bookId }).sort({ timestamp: -1 }).toArray();
  return docs.map((doc) => normalizeReview(doc));
}

export async function fetchReviewById(id: string): Promise<Review | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ReviewDocument>(REVIEWS_COLLECTION);
  const doc = await collection.findOne({ id });
  return doc ? normalizeReview(doc) : null;
}

export async function createReview(payload: CreateReviewInput): Promise<Review> {
  if (!payload) {
    throw new ValidationError('payload is required');
  }

  const bookId = ensureNonEmptyString(payload.bookId, 'bookId');
  const author = ensureNonEmptyString(payload.author, 'author');
  const rating = ensureRating(payload.rating, 'rating');
  const title = ensureNonEmptyString(payload.title, 'title');
  const comment = ensureNonEmptyString(payload.comment, 'comment');
  const timestamp = ensureTimestamp(payload.timestamp);
  const verified = payload.verified !== undefined ? ensureBoolean(payload.verified, 'verified') : false;

  const reviewId = payload.id ? ensureNonEmptyString(payload.id, 'id') : `review-${randomUUID()}`;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ReviewDocument>(REVIEWS_COLLECTION);

  const duplicate = await collection.findOne({ id: reviewId });
  if (duplicate) {
    throw new ValidationError('Review with the same id already exists');
  }

  const review: Review = {
    id: reviewId,
    bookId,
    author,
    rating,
    title,
    comment,
    timestamp,
    verified,
  };

  await collection.insertOne({ ...review, _id: reviewId });
  return review;
}
