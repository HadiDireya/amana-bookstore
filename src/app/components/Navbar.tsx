// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useState, useEffect } from 'react';
import { CartResponse } from '../types';
import { fetchCart, subscribeToCartUpdates } from '@/lib/client/cart-api';

const Navbar: React.FC = () => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const syncFromCart = (cart: CartResponse) => {
      if (!isMounted) return;
      const count = cart.items.reduce((total, item) => total + item.quantity, 0);
      setCartItemCount(count);
    };

    const unsubscribe = subscribeToCartUpdates(syncFromCart);

    fetchCart()
      .then(syncFromCart)
      .catch((error) => {
        console.error('Failed to load cart count', error);
        if (isMounted) {
          setCartItemCount(0);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 cursor-pointer">
          Amana Bookstore
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className={`text-gray-600 hover:text-blue-500 cursor-pointer ${pathname === '/' ? 'text-blue-500 font-semibold' : ''}`}>
            Home
          </Link>
          <Link href="/cart" className={`text-gray-600 hover:text-blue-500 flex items-center cursor-pointer ${pathname === '/cart' ? 'text-blue-500 font-semibold' : ''}`}>
            My Cart
            {cartItemCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
