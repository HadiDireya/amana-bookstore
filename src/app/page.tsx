// src/app/page.tsx
import BookGrid from './components/BookGrid';
import { fetchAllBooks } from '@/lib/book-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const books = await fetchAllBooks();

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
