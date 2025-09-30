// src/app/cart/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CartItem from '../components/CartItem';
import { ResolvedCartItem } from '../types';
import { clearCartItems, fetchCart, removeCartItem, updateCartItemQuantity } from '@/lib/client/cart-api';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<ResolvedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const synchronizeCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const cart = await fetchCart();
      const validItems = cart.items.filter((item): item is ResolvedCartItem => item.book !== null) as ResolvedCartItem[];
      setCartItems(validItems);
      setError(null);
    } catch (err) {
      console.error('Failed to load cart items', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart items');
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    synchronizeCart();
  }, [synchronizeCart]);

  const updateQuantity = async (bookId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const cart = await updateCartItemQuantity(bookId, newQuantity);
      const validItems = cart.items.filter((item): item is ResolvedCartItem => item.book !== null) as ResolvedCartItem[];
      setCartItems(validItems);
    } catch (err) {
      console.error('Failed to update cart item', err);
      setError(err instanceof Error ? err.message : 'Failed to update cart item');
    }
  };

  const removeItem = async (bookId: number) => {
    try {
      const cart = await removeCartItem(bookId);
      const validItems = cart.items.filter((item): item is ResolvedCartItem => item.book !== null) as ResolvedCartItem[];
      setCartItems(validItems);
    } catch (err) {
      console.error('Failed to remove cart item', err);
      setError(err instanceof Error ? err.message : 'Failed to remove cart item');
    }
  };

  const clearCart = async () => {
    try {
      await clearCartItems();
      setCartItems([]);
    } catch (err) {
      console.error('Failed to clear cart', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  };

  const totalPrice = cartItems.reduce((total, item) => {
    if (!item.book) return total;
    return total + item.book.price * item.quantity;
  }, 0);

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-500 mb-4">{error}</h2>
        <button
          onClick={synchronizeCart}
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
          <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            {cartItems.map((item) => (
              <CartItem
                key={item.book.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-800">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1 bg-gray-500 text-white text-center py-3 rounded-md hover:bg-gray-600 transition-colors cursor-pointer">
                Continue Shopping
              </Link>
              <button 
                onClick={clearCart}
                className="flex-1 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
