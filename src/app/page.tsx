// src/app/page.tsx
import { headers } from 'next/headers';
import BookGrid from './components/BookGrid';
import type { Book } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function ensureProtocol(value: string, fallbackProtocol: 'http' | 'https' = 'https'): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${fallbackProtocol}://${value}`;
}

async function resolveBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

  if (host) {
    const protocolHeader = requestHeaders.get('x-forwarded-proto');
    const isLocalHost = host.includes('localhost') || host.startsWith('127.');
    const protocol = protocolHeader ?? (isLocalHost ? 'http' : 'https');
    return stripTrailingSlash(`${protocol}://${host}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return stripTrailingSlash(ensureProtocol(siteUrl));
  }

  if (process.env.VERCEL_URL) {
    return stripTrailingSlash(ensureProtocol(process.env.VERCEL_URL));
  }

  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

async function loadBooks(): Promise<Book[]> {
  const baseUrl = await resolveBaseUrl();

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
