// src/app/page.tsx
import BookGrid from './components/BookGrid';
import type { Book } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

async function loadBooks(): Promise<Book[]> {
  const baseUrl = resolveBaseUrl();

  try {
    const requestUrl = `${baseUrl}/api/books`;
    const response = await fetch(requestUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
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
