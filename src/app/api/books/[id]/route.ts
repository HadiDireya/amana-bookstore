import { NextResponse } from 'next/server';
import { fetchBookById } from '@/lib/book-service';

type RouteParams = Record<string, string | string[] | undefined>;

export async function GET(
  _request: Request,
  context: { params?: Promise<RouteParams> },
) {
  try {
    const params = context.params ? await context.params : undefined;
    const idValue = params?.id;
    const id = Array.isArray(idValue) ? idValue[0] : idValue;
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
