import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';

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

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function initializeClientPromise(): Promise<MongoClient> {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (process.env.NODE_ENV === 'development') {
    const globalRef = globalThis as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalRef._mongoClientPromise) {
      client = new MongoClient(connectionString, options);
      globalRef._mongoClientPromise = client.connect();
    }

    return globalRef._mongoClientPromise;
  }

  client = new MongoClient(connectionString, options);
  return client.connect();
}

if (!isMongoConfigured() && process.env.NODE_ENV !== 'production') {
  console.warn('MONGODB_URI is not configured. Falling back to in-memory/static data store.');
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = initializeClientPromise();
  }
  return clientPromise;
}
