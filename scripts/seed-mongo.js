#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

function loadJson(relativePath) {
  const fullPath = path.resolve(relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw);
}

async function seedCollection(db, collectionName, documents, idField = 'id') {
  const collection = db.collection(collectionName);
  if (!Array.isArray(documents)) {
    throw new Error(`Expected array for collection ${collectionName}`);
  }

  await collection.deleteMany({});
  if (documents.length === 0) {
    console.log(`Cleared collection ${collectionName} (no documents to insert).`);
    return;
  }

  const docsWithIds = documents.map((doc) => {
    if (doc[idField]) {
      return { ...doc, _id: doc[idField] };
    }
    return doc;
  });

  await collection.insertMany(docsWithIds, { ordered: true });
  console.log(`Inserted ${docsWithIds.length} documents into ${collectionName}.`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }

  const dbName = process.env.MONGODB_DB || 'amana_bookstore';
  const booksCollection = process.env.MONGODB_BOOKS_COLLECTION || 'books';
  const reviewsCollection = process.env.MONGODB_REVIEWS_COLLECTION || 'reviews';

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db(dbName);

    const books = loadJson('data/books.json');
    const reviews = loadJson('data/reviews.json');
    const cart = loadJson('data/cart.json');

    await seedCollection(db, booksCollection, books, 'id');
    await seedCollection(db, reviewsCollection, reviews, 'id');
    if (Array.isArray(cart) && cart.length > 0) {
      const cartCollection = process.env.MONGODB_CART_COLLECTION || 'cart';
      await seedCollection(db, cartCollection, cart, 'id');
    }

    console.log('MongoDB seeding completed successfully.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Failed to seed MongoDB:', err);
  process.exitCode = 1;
});
