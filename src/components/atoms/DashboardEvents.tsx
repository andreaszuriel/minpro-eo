import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar, Clock, MapPin, ChevronUp, ChevronDown,
  Search, Plus, Edit, Trash, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
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
import { formatCurrency } from "@/lib/utils"; 
import { toast } from "sonner";
import type { Event } from '@prisma/client'; 

// --- Define ExtendedEvent Type ---

type ExtendedEvent = Event & {
  soldSeats: number;
  totalRevenue: number;
  averageRating: number | null;
  // Add any other properties derived in OrganizerDashboard's processEvents
};

function EventsTab({ events: initialEvents }: { events: ExtendedEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<ExtendedEvent[]>(initialEvents);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [filter, setFilter] = useState("all"); 

  // Function to handle edit
  const handleEdit = (eventId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/organizer/events/edit/${eventId}`);
  };

  // Function to open delete confirmation
  const openDeleteDialog = (eventId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEventToDelete(eventId);
    setIsDeleting(true);
  };

  // Function to handle delete confirmation
  const handleDelete = async () => {
    if (!eventToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api//events/${eventToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      // Remove event from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete));
      toast.success("Event deleted successfully");

      // Close dialog and reset state
      setIsDeleting(false);
      setEventToDelete(null);

      // If the deleted event was expanded, collapse it
      if (expandedEventId === eventToDelete) {
        setExpandedEventId(null);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to cancel delete
  const cancelDelete = () => {
    setIsDeleting(false);
    setEventToDelete(null);
  };

  // Filtered and Searched Events
  const filteredEvents = events
    .filter(event => {
      const now = new Date();
      const startDate = new Date(event.startDate);
      const isSoldOut = event.soldSeats >= event.seats;

      if (filter === 'upcoming') return startDate > now;
      if (filter === 'past') return startDate <= now;
      if (filter === 'soldout') return isSoldOut;
      return true; 
    })
    .filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="text-primary-700 font-bold text-xl">Events List</CardTitle>
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
                <SelectItem value="soldout" className="hover:bg-white hover:text-primary-600 cursor-pointer transition-colors">
                  Sold Out
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
                  ? "You haven't created any events yet."
                  : "Try adjusting your search or filters."}
              </p>
              {events.length === 0 && ( 
                 <Button
                    className="bg-secondary-600 hover:bg-secondary-700"
                    onClick={() => router.push('/organizer/events/${user.id}/create')} 
                 >
                   <Plus className="mr-2 h-4 w-4" />Create Your First Event
                 </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
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
                            <Calendar className="h-full w-full bg-gray-200 p-4 text-gray-400" />
                            }
                        </div>
                        <div className="min-w-0"> 
                            <h3 className="font-medium truncate">{event.title}</h3> 
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <div className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
                            <div className="flex items-center"><Clock className="mr-1 h-3 w-3" />{format(new Date(event.startDate), 'h:mm a')}</div>
                            <div className="flex items-center truncate"><MapPin className="mr-1 h-3 w-3 flex-shrink-0" />{event.location}</div> 
                            </div>
                        </div>
                    </div>


                    {/* Right side: Actions, Stats, Chevron */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0"> 
                      {/* Action buttons that appear on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleEdit(event.id, e)}
                          aria-label={`Edit ${event.title}`}
                        >
                          <Edit className="h-4 w-4 text-primary-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => openDeleteDialog(event.id, e)}
                           aria-label={`Delete ${event.title}`}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="text-right hidden sm:block"> 
                        <div className="font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0, 'IDR')}</div>
                        <div className="text-xs text-gray-500">{event.soldSeats || 0}/{event.seats} tickets</div>
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
                            <span className="text-gray-500">Genre:</span><span className="font-medium text-black break-words">{event.genre}</span>
                            <span className="text-gray-500">Start Date:</span><span className="font-medium text-black">{format(new Date(event.startDate), 'PPp')}</span> 
                            <span className="text-gray-500">End Date:</span><span className="font-medium text-black">{format(new Date(event.endDate), 'PPp')}</span> 
                            <span className="text-gray-500">Location:</span><span className="font-medium text-black break-words">{event.location}</span>
                            <span className="text-gray-500">Capacity:</span><span className="font-medium text-black">{event.seats} seats</span>
                          </div>
                        </div>
                        {/* Column 2: Sales Summary */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-primary-700">Sales Summary</h4>
                          <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-sm"> 
                            <span className="text-gray-500">Tickets Sold:</span><span className="font-medium text-black">{event.soldSeats || 0}</span>
                            <span className="text-gray-500">Available:</span><span className="font-medium text-black">{event.seats - (event.soldSeats || 0)}</span>
                            <span className="text-gray-500">Revenue:</span><span className="font-medium text-black">{formatCurrency(event.totalRevenue || 0, 'IDR')}</span>
                            <span className="text-gray-500">Avg Rating:</span><span className="font-medium text-black">{event.averageRating ? `${event.averageRating.toFixed(1)} / 5.0` : 'N/A'}</span>
                          </div>
                           {/* Stats for smaller screens (visible when expanded) */}
                           <div className="text-left block sm:hidden mt-2">
                             <div className="text-sm font-medium text-primary-600">{formatCurrency(event.totalRevenue || 0, 'IDR')} Revenue</div>
                             <div className="text-xs text-gray-500">{event.soldSeats || 0}/{event.seats} tickets sold</div>
                           </div>
                        </div>

                        {/* Column 3: Actions */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-primary-700">Actions</h4>
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              className="w-full bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100 justify-start" // justify-start
                              onClick={() => handleEdit(event.id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Event
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full bg-red-50 border-red-300 text-red-700 hover:bg-red-100 justify-start" 
                              onClick={() => openDeleteDialog(event.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Event
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Confirm Event Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the event titled "<strong>{events.find(e => e.id === eventToDelete)?.title}</strong>"? This action cannot be undone and will remove all associated data including tickets and bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default EventsTab;