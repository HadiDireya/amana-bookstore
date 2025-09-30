// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { clearCart, getCartWithBookData, removeCartItem, upsertCartItem } from '@/lib/cart-service';
import { fetchBookById } from '@/lib/book-service';

function extractSessionId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get('sessionId');
}

export async function GET(request: Request) {
  try {
    const sessionId = extractSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId query parameter' },
        { status: 400 },
      );
    }

    const cart = await getCartWithBookData(sessionId);
    return NextResponse.json(cart);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, bookId, quantity = 1 } = await request.json();

    if (!sessionId || bookId === undefined || bookId === null) {
      return NextResponse.json(
        { error: 'sessionId and bookId are required' },
        { status: 400 },
      );
    }

    const normalizedBookId = String(bookId);

    const book = await fetchBookById(normalizedBookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 },
      );
    }

    const cart = await upsertCartItem(sessionId, normalizedBookId, quantity);
    return NextResponse.json(cart);
  } catch (err) {
    console.error('Error adding item to cart:', err);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { sessionId, bookId, quantity } = await request.json();

    if (!sessionId || bookId === undefined || bookId === null || typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'sessionId, bookId, and quantity are required' },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 },
      );
    }

    const cart = await upsertCartItem(sessionId, String(bookId), quantity);
    return NextResponse.json(cart);
  } catch (err) {
    console.error('Error updating cart item:', err);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const bookId = searchParams.get('bookId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId query parameter' },
        { status: 400 },
      );
    }

    if (!bookId) {
      const cart = await clearCart(sessionId);
      return NextResponse.json(cart);
    }

    const cart = await removeCartItem(sessionId, bookId);
    return NextResponse.json(cart);
  } catch (err) {
    console.error('Error removing cart item:', err);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 },
    );
  }
}
