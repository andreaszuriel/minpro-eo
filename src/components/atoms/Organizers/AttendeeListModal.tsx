import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Download, Search, Loader2, UserCircle, 
  XCircle, Users, Ticket, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Attendee = {
  userId: string;
  name: string;
  email: string;
  ticketQuantity: number;
  tierType: string;
  totalPaid: number;
  purchaseDate: string;
  ticketCount: number;
  transactionId: string;
};

type AttendeeListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
  eventTitle: string;
};

function AttendeeListModal({ isOpen, onClose, eventId, eventTitle }: AttendeeListModalProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalAttendees, setTotalAttendees] = useState(0);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAttendees();
    }
  }, [isOpen, eventId]);

  const fetchAttendees = async () => {
    if (!eventId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/attendees`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendees');
      }

      const data = await response.json();
      setAttendees(data.attendees);
      setTotalAttendees(data.totalAttendees);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      setError(error instanceof Error ? error.message : "Failed to load attendee data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!attendees.length) return;

    // Create CSV content
    const headers = ["Name", "Email", "Ticket Type", "Ticket Quantity", "Total Paid", "Purchase Date"];
    const csvRows = [headers];

    attendees.forEach(attendee => {
      csvRows.push([
        attendee.name,
        attendee.email,
        attendee.tierType,
        attendee.ticketQuantity.toString(),
        formatCurrency(attendee.totalPaid, 'IDR').replace(/[^\d.,]/g, ''),
        format(new Date(attendee.purchaseDate), 'yyyy-MM-dd HH:mm')
      ]);
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = attendees.filter(attendee => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      attendee.name.toLowerCase().includes(lowerSearchTerm) ||
      attendee.email.toLowerCase().includes(lowerSearchTerm) ||
      attendee.tierType.toLowerCase().includes(lowerSearchTerm)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl rounded-xl overflow-hidden bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3 shadow-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Attendee List</h3>
                <p className="text-sm text-white/80">{eventTitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-primary-500/20 hover:text-white"
            >
              <XCircle className="h-7 w-7" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-hidden flex flex-col">
          {/* Stats and Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pb-4 mb-4 border-b border-slate-200">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 mb-3 md:mb-0 w-full md:w-auto">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-full mr-2">
                  <Ticket className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Attendees</div>
                  <div className="text-lg font-bold text-primary-700">{totalAttendees}</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-600" />
                <Input
                  placeholder="Search attendees..."
                  className="pl-10 pr-4 py-2 h-10 text-gray-800 w-full border border-slate-200 rounded-lg focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                className="bg-secondary-600 hover:bg-secondary-700 text-white shadow-lg shadow-secondary-500/20 transition-all"
                onClick={handleExportCSV}
                disabled={attendees.length === 0 || isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-3">
            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              Showing {filteredAttendees.length} of {totalAttendees} attendees
            </span>
          </div>

          {/* Attendees List */}
          <div className="flex-grow overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
                <p className="text-primary-600 font-medium">Loading attendees...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200 text-red-600">
                <XCircle className="h-12 w-12 text-red-500 mb-3" />
                <p className="font-medium mb-2">Error loading attendees</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : attendees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
                <UserCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-700 font-medium">No attendees found for this event</p>
                <p className="text-gray-500 text-sm mt-1">When tickets are purchased, attendees will appear here</p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ticket Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Paid</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.transactionId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{attendee.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {attendee.tierType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-700">{attendee.ticketQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                          {formatCurrency(attendee.totalPaid, 'IDR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(attendee.purchaseDate), 'MMM d, yyyy h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center">
            <div className="text-xs text-gray-500 flex items-center">
              <ClipboardList className="h-4 w-4 mr-1 text-gray-400" />
              <span>Export the list to work with it offline</span>
            </div>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-slate-200 text-gray-700 bg-slate-100 hover:bg-slate-200"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendeeListModal;