"use client";

import React, { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Globe, 
  PlusCircle, 
  XCircle, 
  Edit, 
  RefreshCw, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Flag
} from "lucide-react";
import { toast } from 'sonner';

// --- Type Definitions ---
interface Country {
  id: number;
  name: string;
  code: string;
}

// --- Component Props Interfaces ---
interface AddCountryFormProps {
  onAdd: (newCountry: Country) => void;
}

interface CountryListProps {
  countries: Country[];
  loading: boolean;
  error: string | null;
  onEdit: (country: Country) => void;
  onDelete: (id: number) => void;
}

interface EditCountryFormProps {
  country: Country;
  onSave: (updatedCountry: Country) => void;
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
  required,
  icon,
  maxLength,
  placeholder
}: { 
  id: string; 
  label: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  required?: boolean;
  icon: React.ReactNode;
  maxLength?: number;
  placeholder?: string;
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
          type="text"
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="bg-white text-gray-900 pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          required={required}
        />
      </div>
    </div>
  );
}

// --- Add Country Form Component ---
function AddCountryForm({ onAdd }: AddCountryFormProps) {
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Country name and code cannot be empty.");
      return;
    }
    if (code.trim().length !== 2) {
      setError("Country code must be exactly 2 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase() }),
      });
      const newCountry = await handleFetchResponse<Country>(response, "Failed to create country");
      onAdd(newCountry);
      setName("");
      setCode("");
      
      // Success toast
      toast.success("Country Created", {
        description: `${newCountry.name} (${newCountry.code}) was added successfully.`,
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
        Add New Country
      </h4>
      
      <FormInput
        id="country-name"
        label="Country Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<Globe className="h-4 w-4" />}
        required
        placeholder="e.g. United States"
      />
      
      <FormInput
        id="country-code"
        label="Country Code (2 letters)"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        icon={<Flag className="h-4 w-4" />}
        required
        maxLength={2}
        placeholder="e.g. US"
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
        disabled={loading || !name.trim() || code.trim().length !== 2}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Create Country
          </>
        )}
      </Button>
    </div>
  );
}

// --- Country List Component ---
function CountryList({ countries, loading, error, onEdit, onDelete }: CountryListProps) {
  if (loading) return (
    <div className="flex justify-center items-center p-6 bg-slate-50 rounded-lg border border-slate-200">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" /> 
      <span className="ml-2 text-gray-700">Loading countries...</span>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200 text-red-600">
      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
  
  if (!countries || countries.length === 0) return (
    <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200 text-gray-500">
      <XCircle className="h-5 w-5 mr-2" />
      <span>No countries found. Add your first one above!</span>
    </div>
  );

  return (
 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="flex items-center text-gray-800 font-medium text-lg mb-4">
        <Globe className="h-5 w-5 mr-2 text-primary-600" />
        Existing Countries
      </h4>

      <ul className="space-y-3">
        {countries.map((country) => (
          <li
            key={country.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg gap-3 transition-colors"
          >
            <div className="flex items-center flex-grow">
              {/* --- Flag Container --- */}
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 border border-gray-300 overflow-hidden shadow-sm">
                {/* Use img tag with dynamic source */}
                <img
                  src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                  alt={`Flag of ${country.name}`}
                  className="w-full h-full object-cover" // Make image fill the container
                  onError={(e) => {
                    console.warn(`Flag not found for code: ${country.code}`);
                  }}
                />
              </div>
              {/* --- End Flag Container --- */}

              <div className="ml-3 overflow-hidden">
                <span className="block font-medium text-gray-900 truncate">
                  {country.name}
                </span>
                <span className="block text-sm text-gray-600">
                  Code: <span className="font-semibold bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{country.code}</span>
                </span>
              </div>
            </div>

            <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
              {/* ... Edit and Delete Buttons ... */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(country)}
                className="border-gray-300 hover:border-primary-400 hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(country.id)}
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

// --- Edit Country Form Component ---
function EditCountryForm({ country, onSave, onCancel }: EditCountryFormProps) {
  const [name, setName] = useState<string>(country.name);
  const [code, setCode] = useState<string>(country.code);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Country name and code cannot be empty.");
      return;
    }
    if (code.trim().length !== 2) {
      setError("Country code must be exactly 2 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/countries/${country.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase() }),
      });
      
      const updatedCountry = await handleFetchResponse<Country>(response, "Failed to update country");
      onSave(updatedCountry);
      
      // Success toast
      toast.success("Country Updated", {
        description: `${updatedCountry.name} (${updatedCountry.code}) details were updated successfully.`,
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
          Edit Country
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
            <Flag className="h-4 w-4 text-primary-600" />
          </div>
          <div className="ml-2 text-sm text-primary-700">
            <span>Original: {country.name} ({country.code})</span>
          </div>
        </div>
      </div>
      
      <FormInput
        id="edit-country-name"
        label="Country Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<Globe className="h-4 w-4" />}
        required
      />
      
      <FormInput
        id="edit-country-code"
        label="Country Code (2 letters)"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        icon={<Flag className="h-4 w-4" />}
        required
        maxLength={2}
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
          disabled={loading || !name.trim() || code.trim().length !== 2}
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

// --- Main Country Management Component ---
export default function CountryManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCountries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/countries");
      const data = await handleFetchResponse<Country[]>(response, "Failed to fetch countries");
      setCountries(data.sort((a, b) => a.name.localeCompare(b.name))); // Sort alphabetically
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching countries");
      }
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCountries();
      toast.success("Refreshed", {
        description: "Country list has been updated.",
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleAddCountry = (newCountry: Country) => {
    setCountries([...countries, newCountry].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
  };

  const handleSaveEdit = (updatedCountry: Country) => {
    setCountries(countries.map((c) => (c.id === updatedCountry.id ? updatedCountry : c)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingCountry(null);
    setError(null); // Clear any previous errors on successful save
  };

  const handleDeleteCountry = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this country? This might affect existing events or users.")) {
      return;
    }
    
    const originalCountries = [...countries];
    const deletedCountry = countries.find(c => c.id === id);
    
    // Optimistic update
    setCountries(countries.filter((c) => c.id !== id));
    setError(null);

    try {
      const response = await fetch(`/api/countries/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete country" }));
        throw new Error(errorData.message || "Failed to delete country");
      }
      
      // Success toast
      toast.success("Country Deleted", {
        description: `${deletedCountry?.name || 'Country'} was removed successfully.`,
        duration: 4000,
      });
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      setCountries(originalCountries); // Revert optimistic update on failure
      
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
          <Globe className="h-5 w-5 mr-2" />
          Country Management
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
      
      {editingCountry ? (
        <EditCountryForm
          country={editingCountry}
          onSave={handleSaveEdit}
          onCancel={() => { setEditingCountry(null); setError(null); }}
        />
      ) : (
        <AddCountryForm onAdd={handleAddCountry} />
      )}
      
      <div className="mt-6 flex-grow overflow-auto">
        <CountryList
          countries={countries}
          loading={loading}
          error={error && !editingCountry ? error : null}
          onEdit={handleEditCountry}
          onDelete={handleDeleteCountry}
        />
      </div>
      
      {countries.length > 0 && !loading && !error && (
        <div className="mt-4 text-center text-sm text-gray-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
          <span className="flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600" />
            {countries.length} {countries.length === 1 ? 'country' : 'countries'} loaded successfully
          </span>
        </div>
      )}
    </div>
  );
}