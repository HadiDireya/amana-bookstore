import { randomUUID } from 'crypto';
import { getMongoClient, isMongoConfigured } from './mongodb';
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

type InMemoryCartStore = Map<string, Map<string, CartItemDocument>>;

function getInMemoryCartStore(): InMemoryCartStore {
  const globalRef = globalThis as typeof globalThis & { __amanaCartStore?: InMemoryCartStore };
  if (!globalRef.__amanaCartStore) {
    globalRef.__amanaCartStore = new Map();
  }
  return globalRef.__amanaCartStore;
}

function getUserCart(store: InMemoryCartStore, userId: string): Map<string, CartItemDocument> {
  let cart = store.get(userId);
  if (!cart) {
    cart = new Map();
    store.set(userId, cart);
  }
  return cart;
}

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
  const client = await getMongoClient();
  return client.db(DB_NAME).collection<CartItemDocument>(CART_COLLECTION);
}

export async function fetchCartItem(userId: string, bookId: string): Promise<CartItem | null> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const normalizedBookId = ensureNonEmptyString(bookId, 'bookId');
  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = store.get(normalizedUserId);
    const doc = userCart?.get(normalizedBookId) ?? null;
    return doc ? normalizeCartItem(doc) : null;
  }

  const collection = await getCollection();
  const doc = await collection.findOne({ userId: normalizedUserId, bookId: normalizedBookId });
  return doc ? normalizeCartItem(doc) : null;
}

export async function fetchCartByUserId(userId: string): Promise<CartItem[]> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = store.get(normalizedUserId);
    if (!userCart) {
      return [];
    }
    return Array.from(userCart.values())
      .slice()
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .map((doc) => normalizeCartItem(doc));
  }

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

  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = getUserCart(store, userId);
    const existing = userCart.get(bookId);

    if (existing) {
      const updatedDoc: CartItemDocument = {
        ...existing,
        quantity: ensureQuantity(existing.quantity + quantityToAdd),
        addedAt: now,
      };
      userCart.set(bookId, updatedDoc);
      return normalizeCartItem(updatedDoc);
    }

    const cartItem: CartItemDocument = {
      id: `cart-${randomUUID()}`,
      userId,
      bookId,
      quantity: quantityToAdd,
      addedAt: now,
    };

    userCart.set(bookId, cartItem);
    return normalizeCartItem(cartItem);
  }

  const collection = await getCollection();
  const existing = await collection.findOne({ userId, bookId });

  if (existing) {
    const updatedDoc = await collection.findOneAndUpdate(
      { userId, bookId },
      {
        $inc: { quantity: quantityToAdd },
        $set: { addedAt: now },
      },
      { returnDocument: 'after' },
    );

    if (!updatedDoc) {
      throw new Error('Failed to update existing cart item');
    }

    return normalizeCartItem(updatedDoc as CartItemDocument);
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

  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = getUserCart(store, userId);
    const existing = userCart.get(bookId);

    const cartItem: CartItemDocument = existing
      ? {
          ...existing,
          quantity: normalizedQuantity,
          addedAt: now,
        }
      : {
          id: newId,
          userId,
          bookId,
          quantity: normalizedQuantity,
          addedAt: now,
        };

    userCart.set(bookId, cartItem);
    return normalizeCartItem(cartItem);
  }

  const collection = await getCollection();
  const updatedDoc = await collection.findOneAndUpdate(
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

  if (!updatedDoc) {
    throw new Error('Failed to update cart item');
  }

  return normalizeCartItem(updatedDoc as CartItemDocument);
}

export async function removeFromCart(userId: string, bookId: string): Promise<boolean> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  const normalizedBookId = ensureNonEmptyString(bookId, 'bookId');
  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = store.get(normalizedUserId);
    if (!userCart) {
      return false;
    }
    const removed = userCart.delete(normalizedBookId);
    if (userCart.size === 0) {
      store.delete(normalizedUserId);
    }
    return removed;
  }

  const collection = await getCollection();
  const result = await collection.deleteOne({ userId: normalizedUserId, bookId: normalizedBookId });
  return result.deletedCount === 1;
}

export async function clearCart(userId: string): Promise<number> {
  const normalizedUserId = ensureNonEmptyString(userId, 'userId');
  if (!isMongoConfigured()) {
    const store = getInMemoryCartStore();
    const userCart = store.get(normalizedUserId);
    if (!userCart) {
      return 0;
    }
    const deletedCount = userCart.size;
    store.delete(normalizedUserId);
    return deletedCount;
  }

  const collection = await getCollection();
  const result = await collection.deleteMany({ userId: normalizedUserId });
  return result.deletedCount ?? 0;
}
