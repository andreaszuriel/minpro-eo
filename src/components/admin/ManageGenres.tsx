"use client";

import React, { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Tag, 
  PlusCircle, 
  XCircle, 
  Edit, 
  RefreshCw, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from 'sonner';

// --- Type Definitions ---
interface Genre {
  id: number;
  name: string;
}

// --- Component Props Interfaces ---
interface AddGenreFormProps {
  onAdd: (newGenre: Genre) => void;
}

interface GenreListProps {
  genres: Genre[];
  loading: boolean;
  error: string | null;
  onEdit: (genre: Genre) => void;
  onDelete: (id: number) => void;
}

interface EditGenreFormProps {
  genre: Genre;
  onSave: (updatedGenre: Genre) => void;
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
  value, 
  onChange, 
  required 
}: { 
  id: string; 
  label: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Tag className="h-4 w-4" />
        </div>
        <input
          type="text"
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

// --- Add Genre Form Component ---
function AddGenreForm({ onAdd }: AddGenreFormProps) {
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Genre name cannot be empty.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const newGenre = await handleFetchResponse<Genre>(response, "Failed to create genre");
      onAdd(newGenre);
      setName("");
      
      // Success toast
      toast.success("Genre Created", {
        description: `${newGenre.name} was added successfully.`,
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
        Add New Genre
      </h4>
      
      <FormInput
        id="genre-name"
        label="Genre Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
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
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Create Genre
          </>
        )}
      </Button>
    </div>
  );
}

// --- Genre List Component ---
function GenreList({ genres, loading, error, onEdit, onDelete }: GenreListProps) {
  if (loading) return (
    <div className="flex justify-center items-center p-6 bg-slate-50 rounded-lg border border-slate-200">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" /> 
      <span className="ml-2 text-gray-700">Loading genres...</span>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200 text-red-600">
      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
  
  if (!genres || genres.length === 0) return (
    <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200 text-gray-500">
      <XCircle className="h-5 w-5 mr-2" />
      <span>No genres found. Add your first one above!</span>
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="flex items-center text-gray-800 font-medium text-lg mb-4">
        <Tag className="h-5 w-5 mr-2 text-primary-600" />
        Existing Genres
      </h4>
      
      <ul className="space-y-3">
        {genres.map((genre) => (
          <li 
            key={genre.id} 
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg gap-3 transition-colors"
          >
            <div className="flex items-center flex-grow">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border border-primary-200">
                <Tag className="h-5 w-5 text-primary-600" />
              </div>
              
              <div className="ml-3 overflow-hidden">
                <span className="block font-medium text-gray-900 truncate">
                  {genre.name}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(genre)}
                className="border-gray-300 hover:border-primary-400 hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDelete(genre.id)}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Edit Genre Form Component ---
function EditGenreForm({ genre, onSave, onCancel }: EditGenreFormProps) {
  const [name, setName] = useState<string>(genre.name);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Genre name cannot be empty.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/genres/${genre.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      
      const updatedGenre = await handleFetchResponse<Genre>(response, "Failed to update genre");
      onSave(updatedGenre);
      
      // Success toast
      toast.success("Genre Updated", {
        description: `${updatedGenre.name} details were updated successfully.`,
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
          <Edit className="h-5 w-5 mr-2 text-primary-600" />
          Edit Genre
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
            <Tag className="h-4 w-4 text-primary-600" />
          </div>
          <span className="ml-2 text-sm text-primary-700">Original name: {genre.name}</span>
        </div>
      </div>
      
      <FormInput
        id="edit-genre-name"
        label="Genre Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      
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
          disabled={loading || !name.trim()}
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

// --- Main Genre Management Component ---
export default function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchGenres = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/genres");
      const data = await handleFetchResponse<Genre[]>(response, "Failed to fetch genres");
      setGenres(data.sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching genres");
      }
      setGenres([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchGenres();
      toast.success("Refreshed", {
        description: "Genre list has been updated.",
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAddGenre = (newGenre: Genre) => {
    setGenres([...genres, newGenre].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted
  };

  const handleEditGenre = (genre: Genre) => {
    setEditingGenre(genre);
  };

  const handleSaveEdit = (updatedGenre: Genre) => {
    setGenres(genres.map((g) => (g.id === updatedGenre.id ? updatedGenre : g)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingGenre(null);
    setError(null); // Clear any previous errors on successful save
  };

  const handleDeleteGenre = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this genre? This might affect existing events.")) {
      return;
    }
    
    const originalGenres = [...genres];
    // Optimistic update
    setGenres(genres.filter((g) => g.id !== id));
    setError(null);

    try {
      const response = await fetch(`/api/genres/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete genre" }));
        throw new Error(errorData.message || "Failed to delete genre");
      }
      
      // Success toast
      const deletedGenre = originalGenres.find(g => g.id === id);
      toast.success("Genre Deleted", {
        description: `${deletedGenre?.name || 'Genre'} was removed successfully.`,
        duration: 4000,
      });
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      setGenres(originalGenres); // Revert optimistic update on failure
      
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
          <Tag className="h-5 w-5 mr-2" />
          Genre Management
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
      
      {editingGenre ? (
        <EditGenreForm
          genre={editingGenre}
          onSave={handleSaveEdit}
          onCancel={() => { setEditingGenre(null); setError(null); }}
        />
      ) : (
        <AddGenreForm onAdd={handleAddGenre} />
      )}
      
      <div className="mt-6 flex-grow overflow-auto">
        <GenreList
          genres={genres}
          loading={loading}
          error={error && !editingGenre ? error : null}
          onEdit={handleEditGenre}
          onDelete={handleDeleteGenre}
        />
      </div>
      
      {genres.length > 0 && !loading && !error && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
          <span className="flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600" />
            {genres.length} genre{genres.length !== 1 ? 's' : ''} loaded successfully
          </span>
        </div>
      )}
    </div>
  );
}