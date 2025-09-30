// src/app/page.tsx
import { headers } from 'next/headers';
import BookGrid from './components/BookGrid';
import type { Book } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadBooks(): Promise<Book[]> {
  let baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!baseUrl) {
    const headerList = await headers();
    const protocol = headerList.get('x-forwarded-proto') ?? 'http';
    const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
    if (host) {
      baseUrl = `${protocol}://${host}`;
    }
  }

  try {
    const requestUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/books` : '/api/books';
    const response = await fetch(requestUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as Book[];
  } catch (error) {
    console.error('Failed to load books from API', error);
    return [];
  }
}

export default async function HomePage() {
  const books = await loadBooks();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <section className="text-center bg-blue-100 p-8 rounded-lg mb-12 shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to the Amana Bookstore!</h1>
        <p className="text-lg text-gray-600">
          Your one-stop shop for the best books. Discover new worlds and adventures.
        </p>
      </section>

      {/* Book Grid */}
      <BookGrid books={books} />
    </div>
  );
}
