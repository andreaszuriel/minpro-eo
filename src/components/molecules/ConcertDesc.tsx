import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, User, ExternalLink, Star, MessageCircle, ThumbsUp } from 'lucide-react';

// Define the Review interface based on your Prisma schema
interface Review {
  id: number;
  userId: string;
  eventId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: {
    name?: string;
    image?: string;
  };
}

interface ConcertDescriptionProps {
  concert: {
    id: number; 
    title: string;
    artist: string;
    startDate: string;
    time: string; 
    location: string;
    description: string | null;
    organizer: string; 
    organizerId?: string;
    averageRating?: number | null;
  };
  genres: string[];
  getFormattedDate: () => string;
}

export default function ConcertDescription({ concert, genres, getFormattedDate }: ConcertDescriptionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate organizer link slug
  const organizerSlug = concert.organizer
    ? concert.organizer.toLowerCase().replace(/\s+/g, '-')
    : 'unknown-organizer';

  // Fetch reviews for this concert
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/reviews?eventId=${concert.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };

    if (concert.id) {
      fetchReviews();
    }
  }, [concert.id]);

  // Format date for reviews
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full md:w-2/3 mb-8 md:mb-0 order-2 md:order-1">
      {/* Concert Details */}
      <h1 className="text-primary-700 text-3xl md:text-4xl font-bold mb-2">{concert.title}</h1>
      <h2 className="text-xl md:text-2xl font-semibold text-primary-600 mb-4">{concert.artist}</h2>

      {/* Genres */}
      <div className="flex flex-wrap gap-2 mb-4">
        {genres.map((genre, index) => (
          <div
            key={index}
            className="bg-tertiary-500 text-black px-2 py-0.5 rounded-full text-xs font-medium"
          >
            {genre}
          </div>
        ))}
      </div>

      {/* Date, Time & Location */}
      <div className="space-y-3 mb-6">
        <div className="text-black flex items-center">
          <Calendar className="h-5 w-5 mr-3 text-primary-600" />
          <span>
            {getFormattedDate()} | {concert.time}
          </span>
        </div>

        <div className="flex items-center text-black">
          <MapPin className="h-5 w-5 mr-3 text-primary-600" />
          <span>{concert.location}</span>
        </div>
      </div>

      <div className="border-t-2 border-gray-300 my-6"></div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">{concert.description ?? 'No description available.'}</p>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* Organizer */}
      <h3 className="text-2xl text-black font-bold mb-4">Organizer</h3>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center mr-3">
          <User className="text-white" />
        </div>
        <div>
          <p className="font-bold text-black">{concert.organizer}</p>
          <Link
            href={`/organizers/${organizerSlug}`}
            className="text-primary-600 hover:text-secondary-600 flex items-center"
          >
            View Profile <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="border-t border-primary-100 my-6"></div>

      {/* Reviews Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl text-black font-bold">Reviews</h3>
          {typeof concert.averageRating === 'number' && concert.averageRating > 0 && (
            <div className="flex items-center px-3 py-1 rounded-lg">
              <div className="flex">
                {renderStars(Math.round(concert.averageRating))}
              </div>
              <span className="ml-2 font-medium text-primary-700">{concert.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">
            <p>Failed to load reviews: {error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No reviews yet for this concert.</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    {review.user?.image ? (
                      <img 
                        src={review.user.image} 
                        alt={review.user?.name || 'User'} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</span>
                      <span className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</span>
                    </div>
                    {renderStars(review.rating)}
                    {review.comment && (
                      <p className="mt-2 text-gray-700">{review.comment}</p>
                    )}
                    <div className="flex items-center mt-2 text-gray-500 text-sm">
                      <button className="flex items-center hover:text-primary-600 transition-colors">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Write a review button */}
        <div className="mt-6 text-center">
          <Link
            href={`/reviews/new?eventId=${concert.id}`}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Star className="h-4 w-4 mr-2" />
            Write a Review
          </Link>
        </div>
      </div>
    </div>
  );
}