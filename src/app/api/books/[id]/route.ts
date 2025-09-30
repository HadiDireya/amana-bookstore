import { NextResponse } from 'next/server';
import { fetchBookById } from '@/lib/book-service';

export async function GET(_request: Request, context: { params?: Promise<{ id?: string }> }) {
  try {
    const params = context.params ? await context.params : undefined;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Book id missing from route params' },
        { status: 400 },
      );
    }
    const book = await fetchBookById(id);
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
