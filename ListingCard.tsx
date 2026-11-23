import Link from 'next/link';
import { formatPrice, type Listing } from '@/lib/types';

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="card listing-card">
      {listing.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.photo_url} alt={listing.title} className="listing-photo" />
      ) : (
        <div className="listing-photo listing-photo-empty" aria-label="No photo">
          No photo
        </div>
      )}
      <div className="listing-body">
        <div className="listing-top">
          <span className="price">{formatPrice(listing.price)}</span>
          {listing.status !== 'available' && (
            <span className="badge">{listing.status}</span>
          )}
        </div>
        <h3>{listing.title}</h3>
        <p className="muted">
          {listing.condition.replace('_', ' ')} · {listing.pickup_spot}
        </p>
      </div>
    </Link>
  );
}
