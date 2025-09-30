'use client';

import { CartResponse } from '@/app/types';

const CART_SESSION_STORAGE_KEY = 'cartSessionId';

function emitCartUpdated(cart: CartResponse) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  }
}

export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('Cart session is only available in the browser');
  }

  const existing = window.localStorage.getItem(CART_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(CART_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

async function parseCartResponse(response: Response): Promise<CartResponse> {
  if (!response.ok) {
    let message: string;
    try {
      const payload = await response.json();
      message = payload?.error || 'Cart request failed';
    } catch {
      message = await response.text();
    }
    throw new Error(message || 'Cart request failed');
  }
  const cart: CartResponse = await response.json();
  emitCartUpdated(cart);
  return cart;
}

export async function fetchCart(): Promise<CartResponse> {
  const sessionId = getOrCreateCartSessionId();
  const url = `/api/cart?sessionId=${encodeURIComponent(sessionId)}`;
  const response = await fetch(url, { cache: 'no-store' });
  return parseCartResponse(response);
}

export async function addItemToCart(bookId: string | number, quantity = 1): Promise<CartResponse> {
  const sessionId = getOrCreateCartSessionId();
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, bookId: String(bookId), quantity }),
  });
  return parseCartResponse(response);
}

export async function updateCartItemQuantity(bookId: string | number, quantity: number): Promise<CartResponse> {
  const sessionId = getOrCreateCartSessionId();
  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, bookId: String(bookId), quantity }),
  });
  return parseCartResponse(response);
}

export async function removeCartItem(bookId: string | number): Promise<CartResponse> {
  const sessionId = getOrCreateCartSessionId();
  const url = `/api/cart?sessionId=${encodeURIComponent(sessionId)}&bookId=${encodeURIComponent(String(bookId))}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });
  return parseCartResponse(response);
}

export async function clearCartItems(): Promise<CartResponse> {
  const sessionId = getOrCreateCartSessionId();
  const url = `/api/cart?sessionId=${encodeURIComponent(sessionId)}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });
  return parseCartResponse(response);
}

export function subscribeToCartUpdates(callback: (cart: CartResponse) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CartResponse>;
    callback(customEvent.detail);
  };

  window.addEventListener('cartUpdated', handler as EventListener);
  return () => window.removeEventListener('cartUpdated', handler as EventListener);
}
