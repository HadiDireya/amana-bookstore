import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

export const isMongoConfigured = Boolean(uri);

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (isMongoConfigured) {
  const connectionString = uri as string;

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(connectionString, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise ?? null;
  } else {
    client = new MongoClient(connectionString, options);
    clientPromise = client.connect();
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('MONGODB_URI is not configured. Falling back to in-memory/static data store.');
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI to enable database-backed features.');
  }
  return clientPromise;
}

export default clientPromise;
