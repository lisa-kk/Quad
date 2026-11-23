export type ListingCategory =
  | 'textbooks'
  | 'electronics'
  | 'clothing'
  | 'dorm'
  | 'sports'
  | 'tickets'
  | 'other';

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair';

export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  college: string | null;
  /** Payment-ready: Stripe Connect account id, null in the MVP. */
  stripe_account_id: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  /** Price in dollars, as a number — Stripe can use it later. */
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  pickup_spot: string;
  photo_url: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  seller?: Profile | null;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing?: Listing | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'dorm', label: 'Dorm & Home' },
  { value: 'sports', label: 'Sports' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'other', label: 'Other' },
];

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

/**
 * Campus pickup spots. Do NOT invent building names —
 * these are the only spots in the MVP. Lisa adds real ORU spots.
 */
export const PICKUP_SUGGESTIONS = [
  'Student Center',
  'Library entrance',
  'Dorm lobby',
  'Chapel steps',
  'Cafeteria',
  'Gym entrance',
] as const;

export const MEETUP_PROMPTS = [
  'Hi! Is this still available?',
  'Can we meet at the Student Center today?',
  'What time works for pickup?',
] as const;

export function isEduEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.edu$/i.test(email.trim());
}

export function formatPrice(price: number): string {
  return `$${Number(price).toFixed(2)}`;
}
