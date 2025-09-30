import { NextResponse } from 'next/server';
import { fetchBookById } from '@/lib/book-service';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const book = await fetchBookById(params.id);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(book);
  } catch (err) {
    console.error('Error fetching book by id:', err);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 },
    );
  }
}
