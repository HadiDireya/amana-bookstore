// src/app/types/index.ts

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  image: string;
  isbn: string;
  genre: string[];
  tags: string[];
  datePublished: string;
  pages: number;
  language: string;
  publisher: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
}

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  addedAt: string;
}

export interface CartItemWithBook extends CartItem {
  book: Book | null;
}

export interface CartResponse {
  sessionId: string;
  items: CartItemWithBook[];
}

export type ResolvedCartItem = CartItemWithBook & { book: Book };

export interface Review {
  id: string;
  bookId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  timestamp: string;
  verified: boolean;
}
