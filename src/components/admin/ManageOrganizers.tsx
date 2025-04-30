"use client";

import React, { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  UserCheck, 
  PlusCircle, 
  UserX, 
  UserCog, 
  Mail, 
  User, 
  Lock, 
  AlertCircle, 
  Save, 
  X, 
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { UserRole } from '@prisma/client';
import { toast } from 'sonner';

// --- Type Definitions ---
interface Organizer {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
}

// --- Component Props Interfaces ---
interface AddOrganizerFormProps {
  onAdd: (newOrganizer: Organizer) => void;
}

interface OrganizerListProps {
  organizers: Organizer[];
  loading: boolean;
  error: string | null;
  onEdit: (organizer: Organizer) => void;
  onDelete: (id: string) => void;
}

interface EditOrganizerFormProps {
  organizer: Organizer;
  onSave: (updatedOrganizer: Organizer) => void;
  onCancel: () => void;
}

// --- Reusable Helper for Fetch ---
async function handleFetchResponse<T>(response: Response, failureMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: failureMessage }));
    throw new Error(errorData.message || failureMessage);
  }
  return response.json() as Promise<T>;
}

// --- Input Component ---
function FormInput({ 
  id, 
  label, 
  type, 
  value, 
  onChange, 
  required, 
  icon 
}: { 
  id: string; 
  label: string; 
  type: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  required?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          {icon}
        </div>
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          className="bg-white text-gray-900 pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          required={required}
        />
      </div>
    </div>
  );
}

// --- Add Organizer Form Component ---
function AddOrganizerForm({ onAdd }: AddOrganizerFormProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: UserRole.organizer }),
      });
      const newOrganizer = await handleFetchResponse<Organizer>(response, "Failed to create organizer");
      onAdd(newOrganizer);
      setName("");
      setEmail("");
      setPassword("");
      
      // Success toast
      toast.success("Organizer Created", {
        description: `${newOrganizer.name || 'New organizer'} was added successfully.`,
        duration: 4000,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      
      // Error toast
      toast.error("Creation Failed", {
        description: err instanceof Error ? err.message : "Please try again.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="flex items-center text-gray-800 font-medium text-lg">
        <PlusCircle className="h-5 w-5 mr-2 text-primary-600" />
        Add New Organizer
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          id="name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="h-4 w-4" />}
        />
        
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="h-4 w-4" />}
        />
      </div>
      
      <FormInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        icon={<Lock className="h-4 w-4" />}
      />
      
      {error && (
        <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        type="button" 
        className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-500/20 cursor-pointer group" 
        onClick={handleSubmit} 
        disabled={loading || !name || !email || !password}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Create Organizer
          </>
        )}
      </Button>
    </div>
  );
}

// --- Organizer List Component ---
function OrganizerList({ organizers, loading, error, onEdit, onDelete }: OrganizerListProps) {
  if (loading) return (
    <div className="flex justify-center items-center p-6 bg-slate-50 rounded-lg border border-slate-200">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" /> 
      <span className="ml-2 text-gray-700">Loading organizers...</span>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200 text-red-600">
      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
  
  if (!organizers || organizers.length === 0) return (
    <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200 text-gray-500">
      <UserX className="h-5 w-5 mr-2" />
      <span>No organizers found. Add your first one above!</span>
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="flex items-center text-gray-800 font-medium text-lg mb-4">
        <UserCheck className="h-5 w-5 mr-2 text-primary-600" />
        Existing Organizers
      </h4>
      
      <ul className="space-y-3">
        {organizers.map((organizer) => (
          <li 
            key={organizer.id} 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg gap-3 transition-colors"
          >
            <div className="flex items-center flex-grow">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border border-primary-200">
                {organizer.image ? (
                  <img
                    src={organizer.image}
                    alt={organizer.name ?? 'Organizer'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <UserCheck className="h-6 w-6 text-primary-600" />
                )}
              </div>
              
              <div className="ml-3 overflow-hidden">
                <span className="block font-medium text-gray-900 truncate">
                  {organizer.name ?? 'Unnamed Organizer'}
                </span>
                <span className="block text-sm text-gray-600 truncate">
                  {organizer.email}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(organizer)}
                className="border-gray-300 hover:border-primary-400 hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
              >
                <UserCog className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDelete(organizer.id)}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                <UserX className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Edit Organizer Form Component ---
function EditOrganizerForm({ organizer, onSave, onCancel }: EditOrganizerFormProps) {
  const [name, setName] = useState<string>(organizer.name ?? "");
  const [email, setEmail] = useState<string>(organizer.email);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        name: name.trim() === "" ? null : name.trim(),
        email
      };
      
      const response = await fetch(`/api/admin/organizers/${organizer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const updatedOrganizer = await handleFetchResponse<Organizer>(response, "Failed to update organizer");
      onSave(updatedOrganizer);
      
      // Success toast
      toast.success("Organizer Updated", {
        description: `${updatedOrganizer.name || 'Organizer'} details were updated successfully.`,
        duration: 4000,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      
      // Error toast
      toast.error("Update Failed", {
        description: err instanceof Error ? err.message : "Please try again.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center text-gray-800 font-medium text-lg">
          <UserCog className="h-5 w-5 mr-2 text-primary-600" />
          Edit Organizer
        </h4>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="bg-primary-50 border border-primary-200 p-3 rounded-md">
        <div className="flex items-center">
          <div className="bg-white/50 rounded-full p-2 shadow-sm">
            <Mail className="h-4 w-4 text-primary-600" />
          </div>
          <span className="ml-2 text-sm text-primary-700">{organizer.email}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <FormInput
          id="edit-name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="h-4 w-4" />}
        />
        
        <FormInput
          id="edit-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="h-4 w-4" />}
        />
      </div>
      
      {error && (
        <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={loading || !email}
          className="bg-secondary-600 hover:bg-secondary-700 text-white transition-all shadow-lg shadow-secondary-500/20 cursor-pointer group"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4 transition-transform group-hover:scale-110" />
              Save Changes
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
          className="border-slate-200 text-gray-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Main Organizer Management Component ---
export default function OrganizerManagement() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOrganizer, setEditingOrganizer] = useState<Organizer | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchOrganizers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/organizers");
      const data = await handleFetchResponse<Organizer[]>(response, "Failed to fetch organizers");
      setOrganizers(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching organizers");
      }
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrganizers();
      toast.success("Refreshed", {
        description: "Organizer list has been updated.",
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleAddOrganizer = (newOrganizer: Organizer) => {
    setOrganizers([...organizers, newOrganizer]);
  };

  const handleEditOrganizer = (organizer: Organizer) => {
    setEditingOrganizer(organizer);
  };

  const handleSaveEdit = (updatedOrganizer: Organizer) => {
    setOrganizers(organizers.map((org) => (org.id === updatedOrganizer.id ? updatedOrganizer : org)));
    setEditingOrganizer(null);
    setError(null); // Clear any previous errors on successful save
  };

  const handleDeleteOrganizer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this organizer? This action cannot be undone.")) {
      return;
    }
    
    const originalOrganizers = [...organizers];
    // Optimistic update
    setOrganizers(organizers.filter((org) => org.id !== id));
    setError(null);

    try {
      const response = await fetch(`/api/admin/organizers/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete organizer" }));
        throw new Error(errorData.message || "Failed to delete organizer");
      }
      
      // Success toast
      const deletedOrg = originalOrganizers.find(org => org.id === id);
      toast.success("Organizer Deleted", {
        description: `${deletedOrg?.name || 'Organizer'} was removed successfully.`,
        duration: 4000,
      });
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      setOrganizers(originalOrganizers); // Revert optimistic update on failure
      
      if (err instanceof Error) {
        setError(`Delete failed: ${err.message}`);
      } else {
        setError("An unknown error occurred during deletion");
      }
      
      // Error toast
      toast.error("Delete Failed", {
        description: err instanceof Error ? err.message : "Please try again.",
        duration: 5000,
      });
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-primary-700 text-xl font-semibold flex items-center">
          <UserCheck className="h-5 w-5 mr-2" />
          Organizer Management
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-slate-200 text-gray-700 bg-white hover:bg-slate-100 cursor-pointer"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {editingOrganizer ? (
        <EditOrganizerForm
          organizer={editingOrganizer}
          onSave={handleSaveEdit}
          onCancel={() => { setEditingOrganizer(null); setError(null); }}
        />
      ) : (
        <AddOrganizerForm onAdd={handleAddOrganizer} />
      )}
      
      <div className="mt-6 flex-grow overflow-auto">
        <OrganizerList
          organizers={organizers}
          loading={loading}
          error={error && !editingOrganizer ? error : null}
          onEdit={handleEditOrganizer}
          onDelete={handleDeleteOrganizer}
        />
      </div>
      
      {organizers.length > 0 && !loading && !error && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
          <span className="flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600" />
            {organizers.length} organizer{organizers.length !== 1 ? 's' : ''} loaded successfully
          </span>
        </div>
      )}
    </div>
  );
}