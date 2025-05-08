'use client';

import { useState, useEffect } from "react";
import {
  Calendar,
  Bookmark,
  BookmarkCheck,
  ArrowUpDown,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define EventData type based on your API response
interface EventData {
  id: number;
  title: string;
  artist: string;
  location: string;
  startDate: string;
  featured: boolean;
  organizer: {
    id: string;
    name: string;
  };
}

export default function EventManagement() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredCount, setFeaturedCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sortField, setSortField] = useState<keyof EventData>("startDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch events data
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all events including past ones for management purposes
      const response = await fetch("/api/admin/events?includeAll=true");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setEvents(data.events);

      // Count featured events
      const featured = data.events.filter((event: EventData) => event.featured);
      setFeaturedCount(featured.length);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle toggling featured status
  const toggleFeatured = async (eventId: number, currentStatus: boolean) => {
    // Check if we're trying to add a new featured event when already at limit
    if (!currentStatus && featuredCount >= 3) {
      setAlertMessage("You can only feature up to 3 events at a time. Please remove an existing featured event before adding a new one.");
      setShowAlert(true);
      return;
    }

    // Optimistic UI Update
    const originalEvents = [...events];
    const newStatus = !currentStatus;
    setEvents(events.map(event => event.id === eventId ? { ...event, featured: newStatus } : event));
    setFeaturedCount(prev => newStatus ? prev + 1 : prev - 1);

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error?.includes("Maximum number")) {
          setAlertMessage(errorData.error);
          setShowAlert(true);
        } else {
          throw new Error(errorData.error || `Failed to update status (${response.status})`);
        }
        // Revert optimistic update on specific errors
        setEvents(originalEvents);
        setFeaturedCount(currentStatus ? featuredCount - 1 : featuredCount + 1);
        return;
      }
    } catch (err) {
      console.error("Error updating featured status:", err);
      setError(err instanceof Error ? err.message : "Failed to update featured status");
      // Revert optimistic update on general fetch error
      setEvents(originalEvents);
      setFeaturedCount(currentStatus ? featuredCount - 1 : featuredCount + 1);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date value");
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  // Handle sorting
  const handleSort = (field: keyof EventData) => {
    const newDirection = (sortField === field && sortDirection === "asc") ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Filter and sort events
  const filteredAndSortedEvents = events
    .filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.organizer?.name && event.organizer.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      let comparison = 0;

      // Handle different data types for comparison
      if (fieldA === null || fieldA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (fieldB === null || fieldB === undefined) return sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'featured':
          comparison = Number(fieldA) - Number(fieldB);
          break;
        case 'title':
        case 'artist':
        case 'location':
          comparison = String(fieldA).localeCompare(String(fieldB));
          break;
        default:
          if (fieldA < fieldB) comparison = -1;
          else if (fieldA > fieldB) comparison = 1;
          else comparison = 0;
      }

      // Check for NaN comparison results
      if (isNaN(comparison)) {
        return 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-xl">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-primary-700">Event Settings</h2>
          <p className="text-gray-600">
            Manage events and select up to 3 featured events to display on the homepage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchEvents}
            variant="outline"
            size="sm"
            className="flex items-center bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-600" /> : <RefreshCw className="mr-2 h-4 w-4 text-primary-600" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Featured Events Counter */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 bg-primary-600 rounded-t-lg border-b border-gray-200">
          <div className="flex items-center space-x-2 pt-4">
            <Star className="h-5 w-5 text-white" fill="currentColor" />
            <CardTitle className="text-xl text-white">Featured Events Selection</CardTitle>
          </div>
          <CardDescription className="text-white">
            Select up to 3 upcoming events to highlight on the featured section.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookmarkCheck className="h-5 w-5 text-tertiary-600" />
              <span className="text-lg font-medium text-gray-800">{featuredCount} of 3 featured events selected</span>
            </div>
            <div className="h-3 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary-600 transition-all duration-300"
                style={{ width: `${(featuredCount / 3) * 100}%` }}
              ></div>
            </div>
          </div>
          {featuredCount >= 3 && (
            <p className="text-sm text-amber-700 mt-2">Maximum featured limit reached.</p>
          )}
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          className="pl-10 border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"
          placeholder="Search events by title, artist, location, or organizer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Error Message Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="link" size="sm" onClick={fetchEvents} className="text-red-700 p-0 h-auto mt-1">
              Try reloading
            </Button>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-x-auto bg-white">
        <Table>
          <TableHeader className="bg-gradient-to-r from-primary-50 to-primary-100">
            <TableRow className="hover:bg-primary-100">
              <TableHead onClick={() => handleSort("featured")} className="cursor-pointer w-[100px] text-primary-700">
                <div className="flex items-center">
                  Featured
                  {sortField === "featured" && (<ArrowUpDown className="ml-1 h-4 w-4 shrink-0 text-primary-700" />)}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("title")} className="cursor-pointer min-w-[150px] text-primary-700">
                <div className="flex items-center">
                  Title
                  {sortField === "title" && (<ArrowUpDown className="ml-1 h-4 w-4 shrink-0 text-primary-700" />)}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("artist")} className="cursor-pointer min-w-[120px] text-primary-700">
                <div className="flex items-center">
                  Artist
                  {sortField === "artist" && (<ArrowUpDown className="ml-1 h-4 w-4 shrink-0 text-primary-700" />)}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("location")} className="cursor-pointer hidden md:table-cell min-w-[150px] text-primary-700">
                <div className="flex items-center">
                  Location
                  {sortField === "location" && (<ArrowUpDown className="ml-1 h-4 w-4 shrink-0 text-primary-700" />)}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("startDate")} className="cursor-pointer hidden md:table-cell min-w-[120px] text-primary-700">
                <div className="flex items-center">
                  Date
                  {sortField === "startDate" && (<ArrowUpDown className="ml-1 h-4 w-4 shrink-0 text-primary-700" />)}
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px] text-primary-700">Organizer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-tertiary-600 mr-2" />
                    <span className="text-gray-700">Loading events...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  {searchQuery ? "No events match your search." : "No events found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  className={`${event.featured ? 'bg-tertiary-50 hover:bg-tertiary-100' : 'hover:bg-slate-100'}`}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFeatured(event.id, event.featured)}
                      disabled={!event.featured && featuredCount >= 3}
                      className={`rounded-full ${
                        event.featured 
                          ? 'text-tertiary-600 hover:bg-tertiary-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      } ${
                        !event.featured && featuredCount >= 3 
                          ? 'cursor-not-allowed opacity-50' 
                          : ''
                      }`}
                      aria-label={event.featured ? "Remove from featured" : "Add to featured"}
                    >
                      {event.featured ? (
                        <BookmarkCheck className="h-5 w-5" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-gray-800">{event.title}</TableCell>
                  <TableCell className="text-gray-700">{event.artist}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-700">{event.location}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="mr-1.5 h-4 w-4 text-primary-500 shrink-0" />
                      {formatDate(event.startDate)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-gray-600">{event.organizer?.name || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary-700">Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {alertMessage || "An issue occurred."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setAlertMessage("")}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
            >
              Okay
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}