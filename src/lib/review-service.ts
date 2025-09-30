import { createReview as createBookReview, fetchReviewById as fetchReviewByIdFromBookService, fetchReviewsForBook } from './book-service';
import type { CreateReviewInput } from './book-service';
import { Review } from '@/app/types';

export type { CreateReviewInput } from './book-service';

export async function fetchReviewsByBookId(bookId: string): Promise<Review[]> {
  return fetchReviewsForBook(bookId);
}

export async function fetchReviewById(id: string): Promise<Review | null> {
  return fetchReviewByIdFromBookService(id);
}

export async function createReview(payload: CreateReviewInput): Promise<Review> {
  return createBookReview(payload);
}
