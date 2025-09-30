import { NextResponse } from 'next/server';
import { fetchAllReviews, fetchReviewsForBook, createReview, ValidationError } from '@/lib/book-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  try {
    const reviews = bookId ? await fetchReviewsForBook(bookId) : await fetchAllReviews();
    return NextResponse.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const review = await createReview(payload);
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 },
      );
    }

    console.error('Error creating review:', err);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 },
    );
  }
}
