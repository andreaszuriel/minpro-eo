"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // Import Label
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  User, Edit3, Search, ChevronLeft, ChevronRight, PlusCircle, MinusCircle, Eye, 
  ShieldCheck, ShieldOff, AlertTriangle, Trash2, CheckCircle, XCircle, Gift, 
  Users, ShoppingBag, KeyRound, Loader2, RefreshCw, ArrowUpDown
} from 'lucide-react';
import { UserRole, TransactionStatus } from '@prisma/client'; 
import { useDebounce } from '@/utils/useDebounce'; 
import { format } from 'date-fns';

// Types (can be in a separate types.ts file)
interface PointTransactionData {
  id: string;
  points: number;
  description: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

interface EventInfo {
  id: number;
  title: string;
  startDate: string;
}

interface TransactionData {
  id: number;
  event: EventInfo;
  ticketQuantity: number;
  finalPrice: number;
  status: TransactionStatus;
  createdAt: string;
}

interface ReferredUserData {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

interface ReferrerInfo {
    id: string;
    name: string | null;
    email: string;
    referralCode: string | null;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string;
  points: number;
  createdAt: string;
  updatedAt?: string; 
  role: UserRole;
  isAdmin: boolean;
  emailVerified: string | null;
  referralCode: string | null;
  referredBy?: string | null; 
  isActive?: boolean; 

  pointTransactions?: PointTransactionData[];
  transactions?: TransactionData[];
  referredUsers?: ReferredUserData[];
  referrerInfo?: ReferrerInfo | null;
}

interface UsersApiResponse {
  users: UserData[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}


// Helper function to get TransactionStatus badge variant
const getTransactionStatusBadgeVariant = (status: TransactionStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case TransactionStatus.PAID:
      case TransactionStatus.WAITING_ADMIN: 
        return "default"; 
      case TransactionStatus.PENDING:
        return "secondary"; 
      case TransactionStatus.CANCELED:
      case TransactionStatus.EXPIRED:
        return "destructive"; 
      default:
        return "outline";
    }
  };

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortField, setSortField] = useState<keyof UserData>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.customer);
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const [pointAmount, setPointAmount] = useState<number>(0);
  const [pointDescription, setPointDescription] = useState('');
  const [pointExpiresInDays, setPointExpiresInDays] = useState<number>(365);

  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [verifiedUsersCount, setVerifiedUsersCount] = useState(0);

  const fetchUsers = useCallback(async (page: number, search: string, sortFld?: keyof UserData, sortDir?: "asc" | "desc") => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: API needs to support sortField and sortDirection for full backend sorting
      // For now, keeping it simple as per original code.
      const response = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`);
      }
      const data: UsersApiResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalUsers(data.totalUsers);
      
      setActiveUsersCount(data.users.filter(user => user.isActive !== false).length);
      setVerifiedUsersCount(data.users.filter(user => user.emailVerified !== null).length);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage, debouncedSearchTerm, sortField, sortDirection);
  }, [fetchUsers, currentPage, debouncedSearchTerm, sortField, sortDirection]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); 
  };

  const handleSort = (field: keyof UserData) => {
    const newDirection = (sortField === field && sortDirection === "asc") ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    // If sorting is done client-side, no need to refetch.
    // If sorting is backend, fetchUsers would be called by useEffect due to sortField/Direction change.
  };

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      let comparison = 0;

      if (fieldA === null || fieldA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (fieldB === null || fieldB === undefined) return sortDirection === 'asc' ? 1 : -1;

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        comparison = fieldA.localeCompare(fieldB);
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        comparison = fieldA - fieldB;
      } else if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
        comparison = Number(fieldA) - Number(fieldB);
      } else if (fieldA instanceof Date && fieldB instanceof Date) { // Should be string from API
        comparison = new Date(fieldA).getTime() - new Date(fieldB).getTime();
      } else {
        comparison = String(fieldA).localeCompare(String(fieldB));
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [users, sortField, sortDirection]);

  const handleViewDetails = async (userId: string) => {
    setIsLoading(true); // Consider a more specific loading state for the modal
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.error || "Failed to fetch user details"}`);
      }
      const userData: UserData = await response.json();
      setSelectedUser(userData);
      setEditName(userData.name || '');
      setEditRole(userData.role);
      setEditIsAdmin(userData.isAdmin);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch user details. Check console and backend logs.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsLoading(true); // Consider modal-specific loading
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName || null, role: editRole, isAdmin: editIsAdmin }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user');
      }
      setIsDetailModalOpen(false);
      fetchUsers(currentPage, debouncedSearchTerm); 
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to update user");
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleActivation = async (userId: string) => {
     if (!confirm("Are you sure you want to toggle activation status for this user?")) return;
     // Consider modal-specific loading
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-activation`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to toggle activation');
      }
      const updatedUserResponse = await response.json(); // Assuming API returns { user: { isActive: boolean, ... } }
      
      // Update local state for the table
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, isActive: updatedUserResponse.user.isActive } : u));
      
      // Update selectedUser if it's the one being modified
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? {...prev, isActive: updatedUserResponse.user.isActive } : null);
      }
       // Re-calculate dashboard stats (or fetchUsers again if stats are complex)
       if (updatedUserResponse.user.isActive) {
        setActiveUsersCount(prev => prev + 1);
       } else {
        setActiveUsersCount(prev => prev - 1);
       }

    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to toggle activation");
    }
  };

  const handleToggleVerification = async (userId: string) => {
    if (!confirm("Are you sure you want to toggle email verification status for this user?")) return;
    // Consider modal-specific loading
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-verification`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`);
      }
      const updatedUserData = await response.json(); // Assuming API returns { user: { emailVerified: string | null, ... } }
      
      // Update local state for the table
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, emailVerified: updatedUserData.user.emailVerified } : u));

      if (selectedUser && selectedUser.id === userId) { 
         setSelectedUser(prev => prev ? {...prev, emailVerified: updatedUserData.user.emailVerified } : null);
      }
      // Re-calculate dashboard stats (or fetchUsers again if stats are complex)
      if (updatedUserData.user.emailVerified) {
        setVerifiedUsersCount(prev => prev + 1);
      } else {
        setVerifiedUsersCount(prev => prev - 1);
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to toggle verification");
    }
  };
  
  const openPointModal = (user: UserData) => {
    setSelectedUser(user);
    setPointAmount(0);
    setPointDescription('');
    setPointExpiresInDays(365);
    setIsPointModalOpen(true);
  };

  const handleAddPoints = async () => {
    if (!selectedUser || pointAmount === 0 || !pointDescription.trim()) return;
    // Consider modal-specific loading
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointAmount, description: pointDescription, expiresInDays: pointExpiresInDays }),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || 'Failed to update points');
      }
      const updatedPointsData = await response.json(); // Assuming API returns new total points or full user

      setIsPointModalOpen(false);
      
      // Update local state for the table
      setUsers(prevUsers => prevUsers.map(u => u.id === selectedUser.id ? { ...u, points: updatedPointsData.newTotalPoints } : u)); // Adjust based on API response

      if(isDetailModalOpen && selectedUser.id === selectedUser.id) {
        // Re-fetch details to update points history and current balance in detail modal
        handleViewDetails(selectedUser.id); 
      } else if (selectedUser) {
        // If detail modal not open, just update the points for selectedUser if it's still relevant
         setSelectedUser(prev => prev ? {...prev, points: updatedPointsData.newTotalPoints} : null);
      }

    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to update points");
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp'); 
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
     try {
      return format(new Date(dateString), 'P');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 p-4 sm:p-6 rounded-xl">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-primary-700">User Management</h2>
          <p className="text-gray-600">
            Manage users, view details, and adjust point balances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => fetchUsers(currentPage, debouncedSearchTerm)}
            variant="outline"
            size="sm"
            className="flex items-center bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
            disabled={isLoading && users.length === 0} // Only disable initial load
          >
            {isLoading && users.length === 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-600" /> : <RefreshCw className="mr-2 h-4 w-4 text-primary-600" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Users Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 bg-primary-600 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center space-x-2 pt-2 sm:pt-4">
              <Users className="h-5 w-5 text-white" />
              <CardTitle className="text-lg sm:text-xl text-white">Total Users</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/90 mt-1">
              Total registered users
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
             <span className="text-2xl font-bold text-gray-800">{totalUsers}</span>
             <span className="text-sm text-gray-600 ml-1">users</span>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 bg-tertiary-600 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center space-x-2 pt-2 sm:pt-4">
              <CheckCircle className="h-5 w-5 text-white" />
              <CardTitle className="text-lg sm:text-xl text-white">Active Users</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/90 mt-1">
              Users with active accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-800">{activeUsersCount}</span>
              <span className="text-sm text-gray-600 ml-1">active</span>
            </div>
            <div className="h-2.5 w-20 sm:w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary-600 transition-all duration-300"
                style={{ width: `${totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3 bg-secondary-600 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center space-x-2 pt-2 sm:pt-4">
              <ShieldCheck className="h-5 w-5 text-white" />
              <CardTitle className="text-lg sm:text-xl text-white">Verified Users</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/90 mt-1">
              Email verified users
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-800">{verifiedUsersCount}</span>
              <span className="text-sm text-gray-600 ml-1">verified</span>
            </div>
            <div className="h-2.5 w-20 sm:w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary-600 transition-all duration-300"
                style={{ width: `${totalUsers > 0 ? (verifiedUsersCount / totalUsers) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          className="pl-10 border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"
          placeholder="Search users by name, email, role, or referral code..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="link" size="sm" onClick={() => fetchUsers(currentPage, debouncedSearchTerm)} className="text-red-700 p-0 h-auto mt-1">
              Try reloading
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-x-auto bg-white">
        <Table>
          <TableHeader className="bg-gradient-to-r from-primary-50 to-primary-100">
            <TableRow className="hover:bg-primary-100/50">
              {/* Table Headers with Sorting */}
              {(["name", "email", "role", "points", "emailVerified", "isActive", "createdAt"] as Array<keyof UserData | string>).map((field) => (
                <TableHead
                  key={field}
                  onClick={() => handleSort(field as keyof UserData)}
                  className={`cursor-pointer text-primary-700 
                    ${(field === "emailVerified" || field === "isActive" || field === "createdAt") ? 'hidden md:table-cell' : ''}
                    ${field === "name" ? "min-w-[150px]" : ""}
                    ${field === "email" ? "min-w-[200px]" : ""}
                  `}
                >
                  <div className="flex items-center">
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} {/* Capitalize and space camelCase */}
                    {sortField === field && (<ArrowUpDown className="ml-1 h-3 w-3 shrink-0 text-primary-600" />)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-primary-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">
                <div className="flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-tertiary-600 mr-2" /> <span className="text-gray-700">Loading users...</span></div>
              </TableCell></TableRow>
            ) : sortedUsers.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-500">
                {searchTerm ? "No users match your search." : "No users found."}
              </TableCell></TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className={`hover:bg-slate-50 ${user.isAdmin ? 'bg-purple-50 hover:bg-purple-100' : ''} transition-colors duration-150`}
                >
                  <TableCell className="font-medium text-gray-800">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2.5 shrink-0 ${user.isActive === false ? 'bg-red-500' : (user.isAdmin ? 'bg-purple-500' : 'bg-green-500')}`}></span>
                      {user.name || <span className="text-gray-400">N/A</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.isAdmin ? "default" : (user.role === UserRole.organizer ? "secondary" : "outline")} 
                           className={`${user.isAdmin ? 'bg-purple-600 text-white hover:bg-purple-700' : (user.role === UserRole.organizer ? 'bg-tertiary-100 text-tertiary-800 hover:bg-tertiary-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')} text-xs`}>
                      {user.isAdmin ? "Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">{user.points}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.emailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 text-xs">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-xs">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.isActive === false ? "destructive" : "default"} className={`${user.isActive === false ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"} text-xs`}>
                      {user.isActive === false ? "Deactivated" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600 text-sm">{formatDateShort(user.createdAt)}</TableCell>
                  <TableCell className="space-x-1 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(user.id)} className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2">
                      <Eye className="h-4 w-4 mr-1" />View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openPointModal(user)} className="text-tertiary-600 hover:text-tertiary-700 hover:bg-tertiary-50 px-2">
                      <PlusCircle className="h-4 w-4 mr-1" />Points
                    </Button>
                    <Button 
                      variant="ghost" size="sm" 
                      onClick={() => handleToggleActivation(user.id)}
                      className={`${user.isActive === false ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"} px-2`}
                    >
                      {user.isActive === false ? <CheckCircle className="h-4 w-4 mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                      {user.isActive === false ? "Activate" : "Deactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <p className="text-sm text-gray-600">Showing {users.length > 0 ? ((currentPage - 1) * 10) + 1 : 0}-{Math.min(currentPage * 10, totalUsers)} of {totalUsers} users</p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || (isLoading && users.length === 0)}
            className="bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-700 px-2 py-1 bg-white border border-gray-300 rounded-md">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || (isLoading && users.length === 0)}
            className="bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          {/* Added bg-white and text-gray-900 for the modal content itself */}
          <DialogContent className="max-w-3xl bg-white text-gray-900">
            <DialogHeader className="pb-2 border-b border-gray-200"> {/* Border color */}
              <DialogTitle className="flex items-center text-xl text-gray-800"> {/* Title text color */}
                <User className="h-5 w-5 mr-2 text-primary-600" /> User Details: {selectedUser.name || selectedUser.email}
              </DialogTitle>
            </DialogHeader>
            {/* TabsList and TabsTrigger usually inherit colors or have their own variants, 
                but ensure they are visible on bg-white. Shadcn typically handles this well. */}
            <Tabs defaultValue="profile" className="mt-1">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-gray-100"> {/* TabsList background */}
                <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 text-gray-600 hover:text-primary-600"><Edit3 className="h-4 w-4 mr-1.5 inline-block"/>Profile</TabsTrigger>
                <TabsTrigger value="points" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 text-gray-600 hover:text-primary-600"><Gift className="h-4 w-4 mr-1.5 inline-block"/>Points</TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 text-gray-600 hover:text-primary-600"><Users className="h-4 w-4 mr-1.5 inline-block"/>Referrals</TabsTrigger>
                <TabsTrigger value="purchases" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 text-gray-600 hover:text-primary-600"><ShoppingBag className="h-4 w-4 mr-1.5 inline-block"/>Purchases</TabsTrigger>
                <TabsTrigger value="auth" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 text-gray-600 hover:text-primary-600"><KeyRound className="h-4 w-4 mr-1.5 inline-block"/>Auth</TabsTrigger>
              </TabsList>
              
              {/* Explicit text colors for labels and content within TabsContent */}
              <TabsContent value="profile" className="mt-4 p-4 space-y-4 max-h-[60vh] overflow-y-auto text-gray-800 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label className="sm:text-right text-gray-600">ID:</Label>
                  <span className="col-span-2 text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">{selectedUser.id}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label className="sm:text-right text-gray-600">Email:</Label>
                  <span className="col-span-2 text-sm text-gray-700">{selectedUser.email}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="edit-name" className="sm:text-right text-gray-600">Name:</Label>
                  {/* Input component usually has its own styling for text and background */}
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="sm:col-span-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="edit-role" className="sm:text-right text-gray-600">Role:</Label>
                  {/* Select component parts usually have their own styling */}
                  <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
                    <SelectTrigger id="edit-role" className="sm:col-span-2 bg-white border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value={UserRole.customer} className="text-gray-800 hover:bg-gray-100">Customer</SelectItem>
                      <SelectItem value={UserRole.organizer} className="text-gray-800 hover:bg-gray-100">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label className="sm:text-right text-gray-600">Is Admin:</Label>
                  <div className="sm:col-span-2 flex items-center space-x-2">
                    <Checkbox id="edit-is-admin" checked={editIsAdmin} onCheckedChange={(checked) => setEditIsAdmin(checked as boolean)} />
                    <Label htmlFor="edit-is-admin" className="text-sm font-normal text-gray-700">
                      {editIsAdmin ? "Yes, user is an Administrator" : "No, user is not an Administrator"}
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-x-4 gap-y-2 pt-2">
                  <Label className="sm:text-right text-gray-600 mt-1.5">Status:</Label> 
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Badge variants usually define their own text/bg colors */}
                    <Badge variant={selectedUser.isActive === false ? "destructive" : "default"} className={`${selectedUser.isActive === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} self-start`}>
                      {selectedUser.isActive === false ? "Deactivated" : "Active"}
                    </Badge>
                    {/* Button variant="outline" typically has light bg and dark text */}
                    <Button size="sm" variant="outline" className="self-start border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => handleToggleActivation(selectedUser.id)}>
                      {selectedUser.isActive === false ? <CheckCircle className="h-4 w-4 mr-1.5"/> : <XCircle className="h-4 w-4 mr-1.5"/>} 
                      {selectedUser.isActive === false ? "Activate User" : "Deactivate User"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                  <Label className="sm:text-right text-gray-600">Registered:</Label>
                  <span className="col-span-2 text-sm text-gray-700">{formatDate(selectedUser.createdAt)}</span>
                </div>
                {selectedUser.updatedAt && 
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
                    <Label className="sm:text-right text-gray-600">Last Updated:</Label>
                    <span className="col-span-2 text-sm text-gray-700">{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                }
                <DialogFooter className="pt-6 border-t border-gray-200"> {/* Border color */}
                  <DialogClose asChild><Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button></DialogClose>
                  {/* Primary button usually has distinct bg/text */}
                  <Button onClick={handleUpdateUser} disabled={isLoading} className="bg-primary-600 text-white hover:bg-primary-700">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="points" className="mt-4 p-4 space-y-4 max-h-[60vh] overflow-y-auto text-gray-800 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Points Management</h3>
                  <Button size="sm" onClick={() => openPointModal(selectedUser)} className="bg-tertiary-600 text-white hover:bg-tertiary-700"><PlusCircle className="h-4 w-4 mr-1.5"/>Adjust Points</Button>
                </div>
                <div className="text-gray-700"><strong>Current Balance:</strong> <span className="font-bold text-lg text-tertiary-600">{selectedUser.points}</span> points</div>
                
                <h4 className="font-medium mt-4 mb-2 text-gray-800">Point Transaction History:</h4>
                {/* ... */}
{selectedUser.pointTransactions && selectedUser.pointTransactions.length > 0 ? (
  <div className="border border-gray-200 rounded-md">
    <Table> 
      <TableHeader><TableRow><TableHead className="text-gray-700">Points</TableHead><TableHead className="text-gray-700">Description</TableHead><TableHead className="text-gray-700">Date</TableHead><TableHead className="text-gray-700">Expires</TableHead><TableHead className="text-gray-700">Status</TableHead></TableRow></TableHeader>
      <TableBody>
        {selectedUser.pointTransactions.map(pt => (
          <TableRow key={pt.id}>
            <TableCell className={`font-medium ${pt.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{pt.points > 0 ? `+${pt.points}` : pt.points}</TableCell>
            <TableCell className="text-sm text-gray-600">{pt.description || 'N/A'}</TableCell>
            <TableCell className="text-sm text-gray-600">{formatDateShort(pt.createdAt)}</TableCell>
            <TableCell className="text-sm text-gray-600">{formatDateShort(pt.expiresAt)}</TableCell>
            <TableCell>{pt.isExpired ? <Badge variant="destructive" className="text-xs">Expired</Badge> : <Badge variant="default" className="bg-green-100 text-green-700 text-xs">Active</Badge>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table> 
  </div>
) : <p className="text-gray-500">No point transactions found.</p>}
{/* ... */}
                <p className="text-xs text-gray-500 mt-2">Note: Point expiration policies are system-wide. This view shows individual transaction expiry.</p>
              </TabsContent>

              <TabsContent value="referrals" className="mt-4 p-4 space-y-4 max-h-[60vh] overflow-y-auto text-gray-800 bg-white">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Referral Tracking</h3>
                <div className="space-y-1 text-gray-700">
                  <div><strong>User's Referral Code:</strong> <Badge variant="secondary">{selectedUser.referralCode || 'N/A'}</Badge></div>
                  {selectedUser.referredBy ? (
                      <div><strong>Referred By Code:</strong> <Badge>{selectedUser.referredBy}</Badge>
                      {selectedUser.referrerInfo && <span className="text-sm text-gray-600"> (User: {selectedUser.referrerInfo.name || selectedUser.referrerInfo.email})</span>}
                      </div>
                  ) : (
                      <div className="text-sm text-gray-600">This user was not referred by anyone.</div>
                  )}
                </div>
                
                <h4 className="font-medium mt-4 mb-2 text-gray-800">Users Referred by {selectedUser.name || selectedUser.email}:</h4>
                {selectedUser.referredUsers && selectedUser.referredUsers.length > 0 ? (
  <div className="border border-gray-200 rounded-md">
    <Table> 
      <TableHeader><TableRow><TableHead className="text-gray-700">Name</TableHead><TableHead className="text-gray-700">Email</TableHead><TableHead className="text-gray-700">Registered</TableHead></TableRow></TableHeader>
      <TableBody>
        {selectedUser.referredUsers.map(refUser => (
          <TableRow key={refUser.id}>
            <TableCell className="text-gray-800">{refUser.name || <span className="text-gray-400">N/A</span>}</TableCell>
            <TableCell className="text-sm text-gray-600">{refUser.email}</TableCell>
            <TableCell className="text-sm text-gray-600">{formatDateShort(refUser.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table> 
  </div>
) : <p className="text-gray-500">This user has not referred anyone.</p>}
                <p className="text-xs text-gray-500 mt-2">Referral reward management typically handled via other system modules.</p>
              </TabsContent>

              <TabsContent value="purchases" className="mt-4 p-4 space-y-4 max-h-[60vh] overflow-y-auto text-gray-800 bg-white">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Purchase Activity</h3>
                {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
  <>
    <p className="text-gray-700"><strong>Total Spent (approx):</strong> <span className="font-bold text-lg text-tertiary-600">${(selectedUser.transactions.reduce((sum, t) => sum + t.finalPrice, 0) / 100).toFixed(2)}</span></p>
    <div className="border border-gray-200 rounded-md mt-2">
      <Table>
        <TableHeader><TableRow><TableHead className="text-gray-700">Event</TableHead><TableHead className="text-gray-700">Date</TableHead><TableHead className="text-gray-700">Qty</TableHead><TableHead className="text-gray-700">Price</TableHead><TableHead className="text-gray-700">Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {selectedUser.transactions.map(tx => (
            <TableRow key={tx.id}>
              <TableCell className="text-sm text-gray-800">
                {tx.event.title}
                <span className="block text-xs text-gray-500">({formatDateShort(tx.event.startDate)})</span>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{formatDateShort(tx.createdAt)}</TableCell>
              <TableCell className="text-sm text-gray-600">{tx.ticketQuantity}</TableCell>
              <TableCell className="text-sm text-gray-600">${(tx.finalPrice / 100).toFixed(2)}</TableCell>
              <TableCell><Badge className="text-xs" variant={getTransactionStatusBadgeVariant(tx.status)}>{tx.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table> 
    </div>
  </>
) : <p className="text-gray-500">No purchase history found.</p>}
                <p className="text-xs text-gray-500 mt-2">Attended events tracking might require deeper integration with ticket usage status.</p>
              </TabsContent>

              <TabsContent value="auth" className="mt-4 p-4 space-y-4 max-h-[60vh] overflow-y-auto text-gray-800 bg-white">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">User Authentication</h3>
                <div className="space-y-1 text-gray-700">
                  <strong>Email Verification Status:</strong>
                  {selectedUser.emailVerified ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 ml-2">Verified on {formatDate(selectedUser.emailVerified)}</Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">Not Verified</Badge>
                  )}
                </div>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-50" 
                    onClick={() => handleToggleVerification(selectedUser.id)}
                >
                  {selectedUser.emailVerified ? <ShieldOff className="h-4 w-4 mr-1.5"/> : <ShieldCheck className="h-4 w-4 mr-1.5"/>}
                  {selectedUser.emailVerified ? 'Mark as Unverified' : 'Mark as Verified'}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Point Adjustment Modal */}
      {selectedUser && (
        <Dialog open={isPointModalOpen} onOpenChange={setIsPointModalOpen}>
          <DialogContent className="sm:max-w-md bg-white text-gray-900"> {/* Modal background and default text */}
            <DialogHeader className="pb-2 border-b border-gray-200"> {/* Border color */}
              <DialogTitle className="flex items-center text-gray-800"> {/* Title text color */}
                <Gift className="h-5 w-5 mr-2 text-tertiary-600"/> Adjust Points for {selectedUser.name || selectedUser.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4 text-gray-800"> {/* Default text for modal body */}
              <div className="flex justify-between items-center text-sm">
                <Label className="text-gray-600">Current Points:</Label>
                <span className="font-semibold text-tertiary-700">{selectedUser.points}</span>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="pointAmount" className="text-sm font-medium text-gray-700">Points to Add/Remove (+/-):</Label>
                <div className="flex items-center space-x-2">
                    <Button size="icon" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setPointAmount(prev => prev - (parseInt(String(pointAmount), 10) === 0 || isNaN(parseInt(String(pointAmount), 10)) ? 10 : 10))}><MinusCircle className="h-4 w-4"/></Button>
                    <Input 
                      id="pointAmount"
                      type="number" 
                      value={pointAmount} 
                      onChange={(e) => setPointAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="e.g., 50 or -20"
                      className="w-full text-center tabular-nums bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"
                    />
                    <Button size="icon" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setPointAmount(prev => prev + 10)}><PlusCircle className="h-4 w-4"/></Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pointDescription" className="text-sm font-medium text-gray-700">Reason for Adjustment:</Label>
                <Input 
                  id="pointDescription"
                  value={pointDescription} 
                  onChange={(e) => setPointDescription(e.target.value)}
                  placeholder="Required: e.g., Manual correction, Bonus"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="expiresInDays" className="text-sm font-medium text-gray-700">Expires in (days):</Label>
                <Input 
                    id="expiresInDays"
                    type="number" 
                    value={pointExpiresInDays} 
                    onChange={(e) => setPointExpiresInDays(parseInt(e.target.value, 10) > 0 ? parseInt(e.target.value, 10) : 365)}
                    placeholder="Default: 365"
                    min="1"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500">Points will expire this many days from now. Default is 365 days.</p>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200"> {/* Border color */}
              <DialogClose asChild><Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button></DialogClose>
              <Button onClick={handleAddPoints} disabled={pointAmount === 0 || !pointDescription.trim() || isLoading} className="bg-primary-600 text-white hover:bg-primary-700">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default UserManagement;