import type { Book, Review } from '@/app/types';

type BookSeed = Omit<Book, 'rating' | 'reviewCount'> & {
  rating?: number;
  reviewCount?: number;
};

export const defaultReviews: Review[] = [
  {
    id: 'review-1a',
    bookId: '1',
    author: 'Layla S.',
    rating: 5,
    title: 'Inspiring and thoughtful',
    comment: 'A gorgeous blend of faith, science, and courage. I could not put it down.',
    timestamp: '2024-01-12T10:15:00.000Z',
    verified: true,
  },
  {
    id: 'review-1b',
    bookId: '1',
    author: 'Noah F.',
    rating: 4,
    title: 'Epic scope',
    comment: 'Some slower chapters, but the world-building is phenomenal.',
    timestamp: '2024-03-01T18:42:00.000Z',
    verified: false,
  },
  {
    id: 'review-2a',
    bookId: '2',
    author: 'Samira K.',
    rating: 5,
    title: 'Rich with history',
    comment: 'Vivid storytelling that makes the city feel alive. Highly recommended.',
    timestamp: '2023-12-04T08:20:00.000Z',
    verified: true,
  },
  {
    id: 'review-2b',
    bookId: '2',
    author: 'Hassan M.',
    rating: 4,
    title: 'Beautiful prose',
    comment: 'A lyrical narrative with only a few pacing issues in the middle acts.',
    timestamp: '2024-02-17T16:05:00.000Z',
    verified: false,
  },
  {
    id: 'review-3a',
    bookId: '3',
    author: 'Maryam Q.',
    rating: 4,
    title: 'Deeply human sci-fi',
    comment: 'Balances algorithms with heart. The ending left me hopeful.',
    timestamp: '2024-04-10T13:10:00.000Z',
    verified: true,
  },
  {
    id: 'review-3b',
    bookId: '3',
    author: 'Jonas P.',
    rating: 5,
    title: 'Could not stop reading',
    comment: 'Characters that stay with you long after the final page.',
    timestamp: '2024-06-02T19:32:00.000Z',
    verified: true,
  },
  {
    id: 'review-4a',
    bookId: '4',
    author: 'Ameenah R.',
    rating: 4,
    title: 'Comforting and warm',
    comment: 'Makes you want to start a garden and invite the neighborhood.',
    timestamp: '2023-11-21T11:45:00.000Z',
    verified: false,
  },
  {
    id: 'review-4b',
    bookId: '4',
    author: 'Bilal T.',
    rating: 3,
    title: 'Slow but charming',
    comment: 'A gentle pace, but the characters are worth the patience.',
    timestamp: '2024-01-08T07:58:00.000Z',
    verified: true,
  },
  {
    id: 'review-5a',
    bookId: '5',
    author: 'Imani J.',
    rating: 5,
    title: 'Bursting with flavor',
    comment: 'The recipes and anecdotes combine into something unforgettable.',
    timestamp: '2024-02-26T20:22:00.000Z',
    verified: true,
  },
  {
    id: 'review-5b',
    bookId: '5',
    author: 'Rashid A.',
    rating: 4,
    title: 'A sensory journey',
    comment: 'You can practically smell the spices. Loved the market lore.',
    timestamp: '2024-05-04T09:14:00.000Z',
    verified: false,
  },
  {
    id: 'review-6a',
    bookId: '6',
    author: 'Farah D.',
    rating: 4,
    title: 'Magical evenings',
    comment: 'The pace mirrors a caravan: unhurried but steady. Worth the ride.',
    timestamp: '2023-10-19T17:25:00.000Z',
    verified: true,
  },
  {
    id: 'review-6b',
    bookId: '6',
    author: 'Yusuf N.',
    rating: 5,
    title: 'Poetic and bold',
    comment: 'A luminous meditation on community and shared starlight.',
    timestamp: '2024-01-30T21:48:00.000Z',
    verified: true,
  },
  {
    id: 'review-7a',
    bookId: '7',
    author: 'Nadia H.',
    rating: 5,
    title: 'Letters that heal',
    comment: 'Every chapter feels like a gentle conversation with an old friend.',
    timestamp: '2024-03-19T12:05:00.000Z',
    verified: false,
  },
  {
    id: 'review-7b',
    bookId: '7',
    author: 'Omar E.',
    rating: 5,
    title: 'Profound and intimate',
    comment: 'Tender reflections on memory, family, and reconciliation.',
    timestamp: '2024-04-25T15:41:00.000Z',
    verified: true,
  },
  {
    id: 'review-8a',
    bookId: '8',
    author: 'Karima W.',
    rating: 4,
    title: 'Quietly powerful',
    comment: 'A gentle story that lingers like the last moments of dawn.',
    timestamp: '2024-02-02T06:33:00.000Z',
    verified: true,
  },
  {
    id: 'review-8b',
    bookId: '8',
    author: 'Idris L.',
    rating: 4,
    title: 'Hopeful and wise',
    comment: 'The characters feel real, and their growth is believable.',
    timestamp: '2024-05-27T22:12:00.000Z',
    verified: false,
  },
];

export const bookSeeds: BookSeed[] = [
  {
    id: '1',
    title: 'The Celestial Voyage',
    author: 'Amara Idris',
    description: 'A healer guides a pilgrim fleet through hidden wormholes, balancing tradition with dazzling new technology.',
    price: 21.95,
    image: '/images/books/celestial-voyage.jpg',
    isbn: '9780000000001',
    genre: ['Science Fiction', 'Adventure'],
    tags: ['space', 'faith', 'journey'],
    datePublished: '2023-02-14',
    pages: 384,
    language: 'English',
    publisher: 'Amana Press',
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    title: 'Echoes in the Minaret',
    author: 'Yusif Al-Karim',
    description: 'A historical mystery set across centuries in a bustling desert metropolis, told through intersecting family stories.',
    price: 18.5,
    image: '/images/books/echoes-minaret.jpg',
    isbn: '9780000000002',
    genre: ['Historical Fiction', 'Mystery'],
    tags: ['family', 'heritage', 'city-life'],
    datePublished: '2022-08-09',
    pages: 416,
    language: 'English',
    publisher: 'Golden Lantern Books',
    inStock: true,
    featured: false,
  },
  {
    id: '3',
    title: 'The Algorithm of Mercy',
    author: 'Sahar Malik',
    description: 'A visionary engineer trains an empathetic AI to aid refugees, only to confront her own past in the process.',
    price: 24.0,
    image: '/images/books/algorithm-mercy.jpg',
    isbn: '9780000000003',
    genre: ['Science Fiction', 'Drama'],
    tags: ['ai', 'refugees', 'ethics'],
    datePublished: '2024-04-02',
    pages: 352,
    language: 'English',
    publisher: 'North Star Press',
    inStock: true,
    featured: true,
  },
  {
    id: '4',
    title: 'Gardeners of the Dunes',
    author: 'Laila Bennani',
    description: 'A community of elders heals their town with a living archive of seeds, songs, and stories.',
    price: 17.75,
    image: '/images/books/gardeners-dunes.jpg',
    isbn: '9780000000004',
    genre: ['Literary Fiction'],
    tags: ['community', 'healing', 'environment'],
    datePublished: '2021-05-18',
    pages: 298,
    language: 'English',
    publisher: 'Saffron House',
    inStock: false,
    featured: false,
  },
  {
    id: '5',
    title: 'Markets at Dawn',
    author: 'Bilqis Rahman',
    description: 'Part travelogue, part cookbook—wander through legendary souks and the stories of the families who run them.',
    price: 29.5,
    image: '/images/books/markets-dawn.jpg',
    isbn: '9780000000005',
    genre: ['Non-fiction', 'Travel'],
    tags: ['food', 'culture', 'memoir'],
    datePublished: '2023-09-12',
    pages: 256,
    language: 'English',
    publisher: 'Spice Route Media',
    inStock: true,
    featured: true,
  },
  {
    id: '6',
    title: 'The Starlit Caravan',
    author: 'Rahim Odeh',
    description: 'A troupe of traveling poets crosses the desert under constellations, weaving festivals in every oasis.',
    price: 19.25,
    image: '/images/books/starlit-caravan.jpg',
    isbn: '9780000000006',
    genre: ['Fantasy', 'Adventure'],
    tags: ['poetry', 'journey', 'culture'],
    datePublished: '2020-11-03',
    pages: 340,
    language: 'English',
    publisher: 'Moonstone Editions',
    inStock: true,
    featured: false,
  },
  {
    id: '7',
    title: 'Fragments of Light',
    author: 'Iman Darzi',
    description: 'A multigenerational saga told through letters discovered in an old ceramic workshop.',
    price: 22.75,
    image: '/images/books/fragments-light.jpg',
    isbn: '9780000000007',
    genre: ['Literary Fiction', 'Family'],
    tags: ['letters', 'legacy', 'identity'],
    datePublished: '2024-01-05',
    pages: 388,
    language: 'English',
    publisher: 'Amana Press',
    inStock: true,
    featured: true,
  },
  {
    id: '8',
    title: 'Letters from the Oasis',
    author: 'Noura Jalil',
    description: 'A contemplative novella about two strangers who exchange letters during the rebuilding of a remote oasis.',
    price: 15.0,
    image: '/images/books/letters-oasis.jpg',
    isbn: '9780000000008',
    genre: ['Novella', 'Romance'],
    tags: ['letters', 'oasis', 'renewal'],
    datePublished: '2019-06-27',
    pages: 192,
    language: 'English',
    publisher: 'Azure Lantern',
    inStock: true,
    featured: false,
  },
];

export type ReviewSummary = {
  average: number;
  count: number;
};

export function buildReviewSummaryMap(reviews: Review[]): Map<string, ReviewSummary> {
  const summary = new Map<string, { count: number; total: number }>();

  reviews.forEach((review) => {
    const bookId = String(review.bookId);
    const current = summary.get(bookId) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += review.rating;
    summary.set(bookId, current);
  });

  const normalized = new Map<string, ReviewSummary>();
  summary.forEach(({ count, total }, bookId) => {
    const average = count === 0 ? 0 : Number((total / count).toFixed(1));
    normalized.set(bookId, { average, count });
  });

  return normalized;
}

const reviewSummary = buildReviewSummaryMap(defaultReviews);

export const defaultBooks: Book[] = bookSeeds.map((seed) => {
  const summaryForBook = reviewSummary.get(seed.id);
  return {
    ...seed,
    rating: summaryForBook?.average ?? seed.rating ?? 0,
    reviewCount: summaryForBook?.count ?? seed.reviewCount ?? 0,
  } satisfies Book;
});
