"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, 
  TicketCheck, 
  Star, 
  Music, 
  Search, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

// --- Types  ---
import type { CustomerStats, CustomerUpcomingEvent } from '@/types/customerDashboard'; // Adjust path as needed

interface CustomerDashboardOverviewProps {
  stats: CustomerStats;
  upcomingEvents: CustomerUpcomingEvent[];
  userId: string;
  userName: string | null;
}

// --- Component ---
export default function CustomerDashboardOverview({
  stats,
  upcomingEvents,
  userId, // Keep 
  userName,
}: CustomerDashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Customer Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Upcoming Events Card */}
        <Card className="border border-primary-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-700 flex items-center justify-between text-sm font-medium">
              <span>Upcoming Events</span>
              <Calendar className="h-4 w-4 text-primary-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.upcomingEventsCount}</div>
            <p className="mt-1 text-xs text-gray-500">Events you have tickets for</p>
          </CardContent>
        </Card>

        {/* Events Attended Card */}
        <Card className="border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 flex items-center justify-between text-sm font-medium">
              <span>Events Attended</span>
              <TicketCheck className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.eventsAttendedCount}</div>
            <p className="mt-1 text-xs text-gray-500">Events you've been to</p>
          </CardContent>
        </Card>

        {/* Reviews Written Card */}
        <Card className="border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700 flex items-center justify-between text-sm font-medium">
              <span>Reviews Written</span>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.reviewsWrittenCount}</div>
            <p className="mt-1 text-xs text-gray-500">Your submitted feedback</p>
          </CardContent>
        </Card>

        {/* Favorite Genre Card */}
        <Card className="border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-700 flex items-center justify-between text-sm font-medium">
              <span>Favorite Genre</span>
              <Music className="h-4 w-4 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate capitalize">
              {stats.favoriteGenre || 'N/A'}
            </div>
            <p className="mt-1 text-xs text-gray-500">Based on events attended</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events List */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary-700">
            Your Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 3).map(event => (
                <Link
                  // Link to the public event details page
                  href={`/events/${event.id}`}
                  key={event.id}
                  className="block shadow-md bg-gray-100 hover:bg-gray-300 rounded-lg border border-gray-200 p-3 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <Calendar className="h-full w-full p-3 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-primary-700 truncate group-hover:text-primary-600">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="mr-1.5 h-3 w-3 flex-shrink-0" />
                        <span>{format(new Date(event.startDate), 'EEE, MMM d, yyyy')}</span>
                      </div>
                       <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Music className="mr-1.5 h-3 w-3 flex-shrink-0" /> {/* Assuming location is always available */}
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    {/* TODO: add a small "View Ticket ->" indicator on hover? */}
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-4 text-center">
                <Calendar className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-600 mb-2">No upcoming events on your schedule.</p>
                <Button variant="outline" size="sm" className="text-primary-600 border-primary-300 hover:bg-primary-50" asChild>
                   <Link href="/events">
                    <Search className="mr-1.5 h-3.5 w-3.5" />Find Events
                   </Link>
                </Button>
              </div>
            )}
            {/* Link to see all upcoming events in the "My Events" tab */}
            {upcomingEvents.length > 3 && (
               <div className="text-center mt-4">
                    <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700" asChild>
                       {/* This should ideally switch the active tab, might need state lifting or context */}
                       <Link href="#events">View All Upcoming</Link>
                    </Button>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}