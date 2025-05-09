'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar, Clock, MapPin, ChevronUp, ChevronDown,
  Search, Eye, Ticket, Star, StarHalf, Edit, Music,
  MessageSquare, Heart, Share2, Camera
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Define types based on the prisma schema
type Review = {
  id: number;
  userId: string;
  eventId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserEvent = {
  id: number;
  title: string;
  artist: string;
  startDate: Date;
  endDate: Date;
  location: string;
  image: string | null;
  description: string | null;
  genre: { name: string };
  country: { name: string };
  seats: number;
  review?: Review | null; // User's personal review
  ticketType?: string; // The type of ticket the user purchased
  hasAttended?: boolean; // Whether the user has attended the event
  tickets?: { tierType: string; isUsed: boolean }[];
  // Include any other event fields needed
};

interface CustomerEventListProps {
  userId: string;
}

function CustomerEventList({ userId }: CustomerEventListProps) {
  const router = useRouter();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<UserEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<{
    eventId: number;
    rating: number;
    comment: string;
    isEdit: boolean;
  } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch user's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/user/${userId}/events`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...events];
    
    // Apply event filter
    const now = new Date();
    
    if (filter === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.startDate) > now);
    } else if (filter === 'past') {
      filtered = filtered.filter(event => new Date(event.startDate) <= now);
    } else if (filter === 'reviewed') {
      filtered = filtered.filter(event => event.review !== null && event.review !== undefined);
    } else if (filter === 'not-reviewed') {
      filtered = filtered.filter(event => {
        const isPast = new Date(event.startDate) <= now;
        const hasNoReview = !event.review;
        return isPast && hasNoReview;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => (
        event.title.toLowerCase().includes(term) ||
        event.artist.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.genre.name.toLowerCase().includes(term)
      ));
    }
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, filter]);

  // Handle view event
  const handleView = (eventId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent toggling expand/collapse when clicking button
    router.push(`/events/${eventId}`);
  };

  // Open review dialog
  const openReviewDialog = (eventId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const event = events.find(e => e.id === eventId);
    const existingReview = event?.review;
    
    setCurrentReview({
      eventId,
      rating: existingReview?.rating || 5,
      comment: existingReview?.comment || '',
      isEdit: !!existingReview
    });
    
    setIsReviewDialogOpen(true);
  };

  // Handle rating change
  const handleRatingChange = (newRating: number) => {
    if (currentReview) {
      setCurrentReview({ ...currentReview, rating: newRating });
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!currentReview) return;
    
    setIsSubmittingReview(true);
    
    try {
      const method = currentReview.isEdit ? 'PUT' : 'POST';
      const endpoint = currentReview.isEdit 
        ? `/api/reviews/${events.find(e => e.id === currentReview.eventId)?.review?.id}` 
        : '/api/reviews';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventId: currentReview.eventId,
          rating: currentReview.rating,
          comment: currentReview.comment
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      const updatedReview = await response.json();
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === currentReview.eventId 
            ? { ...event, review: updatedReview } 
            : event
        )
      );
      
      toast.success(currentReview.isEdit ? "Review updated successfully!" : "Review submitted successfully!");
      setIsReviewDialogOpen(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Show stars for rating selection in review dialog
  const RatingStars = ({ rating, onChange }: { rating: number, onChange: (rating: number) => void }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary-500 border-r-2 border-b-2 mr-2"></div>
          <span>Loading events...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-700">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="text-primary-700 font-bold text-xl">My Events</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-800" />
              <Input
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 text-primary-600 w-full border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-primary-400 text-white hover:bg-white hover:text-primary-600 border border-primary-600 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-primary-400 text-white">
                <SelectItem value="all" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  All Events
                </SelectItem>
                <SelectItem value="upcoming" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  Upcoming
                </SelectItem>
                <SelectItem value="past" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  Past Events
                </SelectItem>
                <SelectItem value="reviewed" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  Reviewed
                </SelectItem>
                <SelectItem value="not-reviewed" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  Not Reviewed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <Calendar className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="mb-1 text-lg font-medium">
                {events.length === 0 ? "No Events Found" : "No Matching Events"}
              </h3>
              <p className="mb-4 text-gray-500">
                {events.length === 0
                  ? "You haven't attended any events yet."
                  : "Try adjusting your search or filters."}
              </p>

              {events.length === 0 && (
                <Button
                  className="bg-secondary-600 hover:bg-secondary-700"
                  onClick={() => router.push('/events')}
                >
                  Explore Events
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => {
                const isUpcoming = new Date(event.startDate) > new Date();
                const hasAttended = event.tickets?.some(ticket => ticket.isUsed) || false;
                
                return (
                  <div key={event.id} className="overflow-hidden rounded-lg border border-gray-200 group">
                    {/* Collapsible Row */}
                    <div
                      className="flex cursor-pointer items-center justify-between bg-white p-4 hover:bg-slate-100 relative"
                      onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                    >
                      {/* Left side: Image, Title, Details */}
                      <div className="flex items-center flex-1 min-w-0 mr-4">
                        <div className="relative mr-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                          {event.image ?
                            <Image src={event.image} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> :
                            <Music className="h-full w-full bg-gray-200 p-4 text-gray-400" />
                          }
                          {hasAttended && (
                            <div className="absolute bottom-0 right-0 bg-green-500 rounded-tl-md p-1">
                              <Ticket className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-primary-700 font-medium truncate">{event.title}</h3>
                          <div className="flex items-center my-1">
                            {event.review ? (
                              <>
                                <div className="flex items-center text-yellow-500">
                                  {[...Array(5)].map((_, i) => {
                                    if (i < Math.floor(event.review!.rating)) {
                                      return <Star key={i} className="h-3.5 w-3.5 fill-current" />;
                                    } else if (i === Math.floor(event.review!.rating) && event.review!.rating % 1 >= 0.5) {
                                      return <StarHalf key={i} className="h-3.5 w-3.5 fill-current" />;
                                    } else {
                                      return <Star key={i} className="h-3.5 w-3.5 text-gray-300" />;
                                    }
                                  })}
                                </div>
                                <span className="ml-1.5 text-xs font-medium text-gray-700">
                                  Your rating: {event.review.rating.toFixed(1)}
                                </span>
                              </>
                            ) : !isUpcoming ? (
                              <span className="text-xs text-gray-500">Not rated yet</span>
                            ) : (
                              <span className="text-xs text-gray-500">Upcoming event</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <div className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
                            <div className="flex items-center"><Clock className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'h:mm a')}</div>
                            <div className="flex items-center truncate"><MapPin className="mr-1 h-3 w-3 flex-shrink-0" />{event.location}</div>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Actions, Status */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Action buttons that appear on hover */}
                        <div className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer h-8 w-8 p-0"
                            onClick={(e) => handleView(event.id, e)}
                            aria-label={`View ${event.title}`}
                          >
                            <Eye className="cursor-pointer h-4 w-4 text-blue-600" />
                          </Button>
                          
                          {!isUpcoming && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer h-8 w-8 p-0"
                              onClick={(e) => openReviewDialog(event.id, e)}
                              aria-label={event.review ? `Edit review for ${event.title}` : `Review ${event.title}`}
                            >
                              {event.review ? (
                                <Edit className="cursor-pointer h-4 w-4 text-primary-600" />
                              ) : (
                                <MessageSquare className="cursor-pointer h-4 w-4 text-yellow-600" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Event Status */}
                        <div className="hidden sm:block">
                          {isUpcoming ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Upcoming
                            </span>
                          ) : hasAttended ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Attended
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              Past
                            </span>
                          )}
                        </div>

                        {/* Chevron and Text */}
                        <div className="flex items-center">
                          <span className="text-xs text-primary-600 mr-1 hidden md:inline group-hover:inline transition-all">
                            {expandedEventId === event.id ? "Hide" : "Details"}
                          </span>
                          {expandedEventId === event.id ?
                            <ChevronUp className="h-5 w-5 text-gray-400" /> :
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedEventId === event.id && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Column 1: Event Details */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-primary-700">Event Details</h4>
                            <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm">
                              <span className="text-gray-500">Artist:</span><span className="font-medium text-black break-words">{event.artist}</span>
                              <span className="text-gray-500">Genre:</span><span className="font-medium text-black break-words">{event.genre?.name ?? 'N/A'}</span>
                              <span className="text-gray-500">Country:</span><span className="font-medium text-black break-words">{event.country?.name ?? 'N/A'}</span>
                              <span className="text-gray-500">Start Date:</span><span className="font-medium text-black">{format(new Date(event.startDate), 'PPp')}</span>
                              <span className="text-gray-500">End Date:</span><span className="font-medium text-black">{format(new Date(event.endDate), 'PPp')}</span>
                              <span className="text-gray-500">Location:</span><span className="font-medium text-black break-words">{event.location}</span>
                            </div>
                          </div>
                          
                          {/* Column 2: Your Experience */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-primary-700">Your Experience</h4>
                            <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm">
                              <span className="text-gray-500">Status:</span>
                              <span className="font-medium text-black">
                                {isUpcoming ? 'Upcoming Event' : hasAttended ? 'Attended' : 'Past Event'}
                              </span>
                              <span className="text-gray-500">Ticket Type:</span>
                              <span className="font-medium text-black">
                                {event.tickets && event.tickets.length > 0 
                                  ? event.tickets[0].tierType 
                                  : 'N/A'}
                              </span>
                              <span className="text-gray-500">Your Rating:</span>
                              <span className="font-medium text-black flex items-center">
                                {event.review ? (
                                  <>
                                    <div className="flex items-center text-yellow-500 mr-1">
                                      {[...Array(5)].map((_, i) => {
                                        if (i < Math.floor(event.review!.rating)) {
                                          return <Star key={i} className="h-3.5 w-3.5 fill-current" />;
                                        } else if (i === Math.floor(event.review!.rating) && event.review!.rating % 1 >= 0.5) {
                                          return <StarHalf key={i} className="h-3.5 w-3.5 fill-current" />;
                                        } else {
                                          return <Star key={i} className="h-3.5 w-3.5 text-gray-300" />;
                                        }
                                      })}
                                    </div>
                                    {event.review.rating.toFixed(1)}
                                  </>
                                ) : (
                                  'Not rated yet'
                                )}
                              </span>
                              
                              {event.review?.comment && (
                                <>
                                  <span className="text-gray-500">Your Review:</span>
                                  <span className="font-medium text-black break-words">
                                    "{event.review.comment}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Column 3: Actions */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-primary-700">Actions</h4>
                            <div className="flex flex-col space-y-2">
                              {/* View Button */}
                              <Button
                                variant="outline"
                                className="cursor-pointer w-full bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 justify-start"
                                onClick={() => handleView(event.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Event Details
                              </Button>
                              
                              {/* Review Button - Only for past events */}
                              {!isUpcoming && (
                                <Button
                                  variant="outline"
                                  className={`cursor-pointer w-full ${
                                    event.review
                                      ? "bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100"
                                      : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                  } justify-start`}
                                  onClick={() => openReviewDialog(event.id)}
                                >
                                  {event.review ? (
                                    <>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Your Review
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Write a Review
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Share Button */}
                              <Button
                                variant="outline"
                                className="cursor-pointer w-full bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 justify-start"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Share functionality could be expanded
                                  navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                                  toast.success("Event link copied to clipboard!");
                                }}
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Event
                              </Button>
                              
                              {hasAttended && (
                                <Button
                                  variant="outline"
                                  className="cursor-pointer w-full bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info("Photo memories feature coming soon!");
                                  }}
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  View My Photos
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Description Section (if available) */}
                        {event.description && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h4 className="font-medium text-primary-700 mb-2">Event Description</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {event.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {currentReview && (
        <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <AlertDialogContent className="max-w-md bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-primary-800">
                {currentReview.isEdit ? 'Edit Your Review' : 'Share Your Experience'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-black">
                {currentReview.isEdit
                  ? 'Update your rating and review for this event.'
                  : 'How would you rate your experience at this event?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Rating</label>
                <RatingStars rating={currentReview.rating} onChange={handleRatingChange} />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Review (Optional)</label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Share your thoughts about this event..."
                  value={currentReview.comment}
                  onChange={(e) => setCurrentReview({ ...currentReview, comment: e.target.value })}
                />
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmittingReview}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isSubmittingReview
                  ? 'Submitting...'
                  : currentReview.isEdit
                    ? 'Update Review'
                    : 'Submit Review'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export default CustomerEventList;