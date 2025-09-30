// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { fetchAllBooks, createBook, ValidationError } from '@/lib/book-service';

// GET /api/books - Return all books
export async function GET() {
  try {
    const books = await fetchAllBooks();
    return NextResponse.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const book = await createBook(payload);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 },
      );
    }

    console.error('Error creating book:', err);
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 },
    );
  }
}

// Future implementation notes:
// - Connect to a database (e.g., PostgreSQL, MongoDB)
// - Add authentication middleware for admin operations
// - Implement pagination for large datasets
// - Add filtering and search query parameters
// - Include proper error handling and logging
// - Add rate limiting for API protection
// - Implement caching strategies for better performance

// Example future database integration:
// import { db } from '@/lib/database';
// 
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = parseInt(searchParams.get('page') || '1');
//   const limit = parseInt(searchParams.get('limit') || '10');
//   const genre = searchParams.get('genre');
//   
//   try {
//     const books = await db.books.findMany({
//       where: genre ? { genre: { contains: genre } } : {},
//       skip: (page - 1) * limit,
//       take: limit,
//     });
//     
//     return NextResponse.json(books);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Database connection failed' },
//       { status: 500 }
//     );
//   }
// }
