// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import {
  addToCart,
  clearCart,
  fetchCartByUserId,
  removeFromCart,
  updateCartItemQuantity,
} from '@/lib/cart-service';
import { fetchBookById, fetchBooksByIds } from '@/lib/book-service';
import { CartItemWithBook, CartResponse } from '@/app/types';

function extractSessionId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get('sessionId');
}

async function buildCartResponse(userId: string): Promise<CartResponse> {
  const items = await fetchCartByUserId(userId);

  if (items.length === 0) {
    return {
      sessionId: userId,
      items: [],
    };
  }

  const bookIds = Array.from(new Set(items.map((item) => item.bookId)));
  const books = await fetchBooksByIds(bookIds);
  const bookMap = new Map(books.map((book) => [String(book.id), book]));

  const enriched = items.map((item) => ({
    ...item,
    book: bookMap.get(item.bookId) ?? null,
  })) satisfies CartItemWithBook[];

  return {
    sessionId: userId,
    items: enriched,
  };
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

    const cart = await buildCartResponse(sessionId);
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

    await addToCart({ userId: sessionId, bookId: normalizedBookId, quantity });
    const cart = await buildCartResponse(sessionId);
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

    await updateCartItemQuantity({ userId: sessionId, bookId: String(bookId), quantity });
    const cart = await buildCartResponse(sessionId);
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
      await clearCart(sessionId);
      return NextResponse.json({ sessionId, items: [] });
    }

    const removed = await removeFromCart(sessionId, bookId);
    if (!removed) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 },
      );
    }

    const cart = await buildCartResponse(sessionId);
    return NextResponse.json(cart);
  } catch (err) {
    console.error('Error removing cart item:', err);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 },
    );
  }
}
