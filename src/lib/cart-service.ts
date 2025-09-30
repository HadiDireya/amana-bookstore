import { randomUUID } from 'crypto';
import { MongoClient } from 'mongodb';
import clientPromise from './mongodb';
import { CartItem, CartItemWithBook, CartResponse } from '@/app/types';
import { fetchBooksByIds } from './book-service';

const DB_NAME = process.env.MONGODB_DB || 'amana_bookstore';
const CART_COLLECTION = process.env.MONGODB_CART_COLLECTION || 'cart';

interface CartDocument {
  sessionId: string;
  items: CartItem[];
  updatedAt: string;
}

function sanitizeCart(doc: CartDocument | null, sessionId: string): CartDocument {
  if (!doc) {
    return {
      sessionId,
      items: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return doc;
}

async function getCollection(client?: MongoClient) {
  const resolvedClient = client ?? (await clientPromise);
  return resolvedClient.db(DB_NAME).collection<CartDocument>(CART_COLLECTION);
}

export async function getOrCreateCart(sessionId: string): Promise<CartDocument> {
  const client = await clientPromise;
  const collection = await getCollection(client);

  const existing = await collection.findOne({ sessionId });
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const cart: CartDocument = {
    sessionId,
    items: [],
    updatedAt: now,
  };

  await collection.insertOne(cart);
  return cart;
}

export async function getCartWithBookData(sessionId: string): Promise<CartResponse> {
  const client = await clientPromise;
  const collection = await getCollection(client);
  const doc = await collection.findOne({ sessionId });
  const cart = sanitizeCart(doc, sessionId);

  if (cart.items.length === 0) {
    return {
      sessionId,
      items: [],
    };
  }

  const bookIds = [...new Set(cart.items.map(item => item.bookId))];
  const books = await fetchBooksByIds(bookIds);
  const bookMap = new Map(books.map(book => [String(book.id), book]));

  const enrichedItems: CartItemWithBook[] = cart.items.map(item => ({
    ...item,
    book: bookMap.get(item.bookId) ?? null,
  }));

  return {
    sessionId,
    items: enrichedItems,
  };
}

export async function upsertCartItem(sessionId: string, bookId: string, quantity: number): Promise<CartResponse> {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  const client = await clientPromise;
  const collection = await getCollection(client);
  const cart = await getOrCreateCart(sessionId);
  const now = new Date().toISOString();

  const items = [...cart.items];
  const existingIndex = items.findIndex(item => item.bookId === bookId);
  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity,
      addedAt: now,
    };
  } else {
    const cartItem: CartItem = {
      id: `${bookId}-${randomUUID()}`,
      bookId,
      quantity,
      addedAt: now,
    };
    items.push(cartItem);
  }

  await collection.updateOne(
    { sessionId },
    {
      $set: {
        items,
        updatedAt: now,
      },
    },
  );

  return getCartWithBookData(sessionId);
}

export async function removeCartItem(sessionId: string, bookId: string): Promise<CartResponse> {
  const client = await clientPromise;
  const collection = await getCollection(client);

  await collection.updateOne(
    { sessionId },
    {
      $pull: {
        items: { bookId },
      },
      $set: {
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return getCartWithBookData(sessionId);
}

export async function clearCart(sessionId: string): Promise<CartResponse> {
  const client = await clientPromise;
  const collection = await getCollection(client);

  await collection.updateOne(
    { sessionId },
    {
      $set: {
        items: [],
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return {
    sessionId,
    items: [],
  };
}
