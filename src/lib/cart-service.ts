import { randomUUID } from 'crypto';
import clientPromise from './mongodb';
import { ValidationError } from './book-service';
import { CartItem } from '@/app/types';

export const DB_NAME = process.env.MONGODB_DB || 'amana_bookstore';
export const CART_COLLECTION = process.env.MONGODB_CART_COLLECTION || 'cart';

type CartItemDocument = {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  addedAt: string;
  _id?: string;
};

export interface AddToCartInput {
  userId: string;
  bookId: string;
  quantity?: number;
}

export interface UpdateCartQuantityInput {
  userId: string;
  bookId: string;
  quantity: number;
}

function stripMongoId(doc: CartItemDocument): CartItemDocument {
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

function ensureQuantity(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    throw new ValidationError('quantity must be a positive number');
  }
  return Math.floor(numeric);
}

function ensureTimestamp(value?: string): string {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('addedAt must be a valid ISO date string');
  }
  return parsed.toISOString();
}

function normalizeCartItem(doc: CartItemDocument): CartItem {
  const sanitized = stripMongoId(doc);
  return {
    id: ensureNonEmptyString(sanitized.id, 'id'),
    bookId: ensureNonEmptyString(sanitized.bookId, 'bookId'),
    quantity: ensureQuantity(sanitized.quantity),
    addedAt: ensureTimestamp(sanitized.addedAt),
  } satisfies CartItem;
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection<CartItemDocument>(CART_COLLECTION);
}

export async function fetchCartItem(userId: string, bookId: string): Promise<CartItem | null> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const normalizedBookId = ensureNonEmptyString(bookId, 'bookId');
  const collection = await getCollection();
  const doc = await collection.findOne({ userId: normalizedUserId, bookId: normalizedBookId });
  return doc ? normalizeCartItem(doc) : null;
}

export async function fetchCartByUserId(userId: string): Promise<CartItem[]> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const collection = await getCollection();
  const docs = await collection.find({ userId: normalizedUserId }).sort({ addedAt: -1 }).toArray();
  return docs.map((doc) => normalizeCartItem(doc));
}

export async function addToCart(payload: AddToCartInput): Promise<CartItem> {
  if (!payload) {
    throw new ValidationError('payload is required');
  }

  const userId = ensureNonEmptyString(payload.userId, 'userId');
  const bookId = ensureNonEmptyString(payload.bookId, 'bookId');
  const quantityToAdd = ensureQuantity(payload.quantity ?? 1);
  const now = new Date().toISOString();

  const collection = await getCollection();
  const existing = await collection.findOne({ userId, bookId });

  if (existing) {
    const updateResult = await collection.findOneAndUpdate(
      { userId, bookId },
      {
        $inc: { quantity: quantityToAdd },
        $set: { addedAt: now },
      },
      { returnDocument: 'after' },
    );

    const updatedDoc = updateResult?.value;
    if (!updatedDoc) {
      throw new Error('Failed to update existing cart item');
    }

    return normalizeCartItem(updatedDoc);
  }

  const cartItem: CartItemDocument = {
    id: `cart-${randomUUID()}`,
    userId,
    bookId,
    quantity: quantityToAdd,
    addedAt: now,
  };

  await collection.insertOne({ ...cartItem, _id: cartItem.id });
  return normalizeCartItem(cartItem);
}

export async function updateCartItemQuantity(payload: UpdateCartQuantityInput): Promise<CartItem> {
  if (!payload) {
    throw new ValidationError('payload is required');
  }

  const userId = ensureNonEmptyString(payload.userId, 'userId');
  const bookId = ensureNonEmptyString(payload.bookId, 'bookId');
  const normalizedQuantity = ensureQuantity(payload.quantity);
  const now = new Date().toISOString();
  const newId = `cart-${randomUUID()}`;

  const collection = await getCollection();
  const updateResult = await collection.findOneAndUpdate(
    { userId, bookId },
    {
      $set: {
        quantity: normalizedQuantity,
        addedAt: now,
      },
      $setOnInsert: {
        id: newId,
        userId,
        bookId,
        _id: newId,
      },
    },
    { returnDocument: 'after', upsert: true },
  );

  const updatedDoc = updateResult?.value;
  if (!updatedDoc) {
    throw new Error('Failed to update cart item');
  }

  return normalizeCartItem(updatedDoc);
}

export async function removeFromCart(userId: string, bookId: string): Promise<boolean> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const normalizedBookId = ensureNonEmptyString(bookId, 'bookId');
  const collection = await getCollection();
  const result = await collection.deleteOne({ userId: normalizedUserId, bookId: normalizedBookId });
  return result.deletedCount === 1;
}

export async function clearCart(userId: string): Promise<number> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const collection = await getCollection();
  const result = await collection.deleteMany({ userId: normalizedUserId });
  return result.deletedCount ?? 0;
}
