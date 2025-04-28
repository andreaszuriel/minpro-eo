"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatISO } from "date-fns";
import { Toaster, toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  Music,
  FileImage,
  Save,
  PlusCircle,
  Info,
  Trash2,
  Upload,
  Loader2,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 

interface TicketTier {
  name: string;
  price: number;
}

export default function CreateEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const organizerId = resolvedParams.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [genres, setGenres] = useState<{id: number, name: string}[]>([]);
const [countries, setCountries] = useState<{id: number, name: string, code: string}[]>([]);
const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    artist: "",
    genreName: "",
    countryCode: "", 
    startDate: "",
    endDate: "",
    location: "",
    seats: 0,
    description: "",
    image: "",
  });

  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: "General", price: 0 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUploadClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", {
        description: "Please upload an image file (JPEG, PNG, etc.)",
      });
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    // Set uploading state
    setUploadingImage(true);
    
    try {
      // Create form data and append file
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      const data = await response.json();
      
      // Update form with cloudinary URL
      setForm(prev => ({ ...prev, image: data.url }));
      toast.success("Image uploaded successfully");
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload image", {
        description: "Please try again or use a different image.",
      });
      
      // Clear preview if upload failed
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setForm(prev => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTicketTierChange = (index: number, field: keyof TicketTier, value: string) => {
    const updatedTiers = [...ticketTiers];
    if (field === 'price') {
      updatedTiers[index][field] = parseInt(value) || 0;
    } else {
      updatedTiers[index][field] = value as string;
    }
    setTicketTiers(updatedTiers);
  };

  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { name: "", price: 0 }]);
  };

  const removeTicketTier = (index: number) => {
    if (ticketTiers.length > 1) {
      const updatedTiers = [...ticketTiers];
      updatedTiers.splice(index, 1);
      setTicketTiers(updatedTiers);
    } else {
      toast.error("You need at least one ticket tier");
    }
  };

  const validateForm = () => {
    // Basic validation
    if (
      !form.title.trim() ||
      !form.genreName.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.location.trim() ||
      !form.seats
    ) {
      toast.error("Missing required fields", {
        description: "Please fill in all required fields to continue.",
      });
      return false;
    }

    // Validate dates
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Invalid dates", {
        description: "Please select valid start and end dates/times.",
      });
      return false;
    }

    if (start >= end) {
      toast.error("Date range error", {
        description: "End date must be after start date.",
      });
      return false;
    }

    // Validate ticket tiers
    if (ticketTiers.some(tier => !tier.name.trim())) {
      toast.error("Invalid ticket tiers", {
        description: "All ticket tiers must have a name.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const payload = {
        title: form.title,
        artist: form.artist,
        genreName: form.genreName,     
        countryCode: form.countryCode, 
        location: form.location,
        seats: Number(form.seats),
        description: form.description,
        image: form.image,
        organizerId: organizerId,     
        startDate: formatISO(start),
        endDate: formatISO(end),
        tiers: ticketTiers,            
        price: ticketTiers,          
        
      };

      console.log("Sending Payload:", JSON.stringify(payload, null, 2)); // Log before sending

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try parsing JSON error first for better messages
        let errorDescription = "Please check details and try again.";
        try {
            const errorData = await res.json();
            console.error("Failed to create event - Server Response:", errorData);
            if (errorData.error) {
                errorDescription = errorData.error;
            }
        } catch (parseError) {
            // If response is not JSON, use text
            const errorText = await res.text();
            console.error("Failed to create event - Server Response (Non-JSON):", errorText);
            errorDescription = errorText.substring(0, 100); 
        }
        toast.error("Failed to create event", {
          description: errorDescription,
        });
      } else {
        toast.success("Event Created!", {
          description: "Your event has been created successfully.",
        });
        router.push(`/dashboard/${organizerId}`); 
      }
    } catch (err) {
      console.error("Client-side error during handleSubmit:", err);
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true); // Set loading to true when starting fetch
      try {
        // Fetch genres
        const genresResponse = await fetch('/api/genres');
        if (genresResponse.ok) {
          const genresData = await genresResponse.json();
          setGenres(genresData.genres);
        } else {
           console.error("Failed to fetch genres");
           toast.error("Failed to load genres");
        }

        // Fetch countries
        const countriesResponse = await fetch('/api/countries');
        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData.countries);
        } else {
           console.error("Failed to fetch countries");
           toast.error("Failed to load countries");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setDataLoading(false); // Set loading to false when fetch finishes (success or fail)
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-3xl mt-12 py-8 px-4 sm:px-6">
        <div className="bg-white rounded-xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
            <div className="flex items-center">
              <div className="bg-white text-primary-700 rounded-full p-2 mr-3 shadow-lg">
                <Music className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold">Create New Event</h1>
            </div>
            <p className="mt-2 text-primary-100 text-sm">Fill in the details below to create your event</p>
          </div>
          
          <div className="p-6">
            {/* Basic Info */}
            <div className="space-y-5">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 mr-2 text-primary-600" />
                  Event Title
                </label>
                <Input 
                  name="title" 
                  placeholder="e.g. Summer Music Festival 2025" 
                  value={form.title} 
                  onChange={handleChange} 
                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Users className="h-4 w-4 mr-2 text-primary-600" />
                  Artist/Performer
                </label>
                <Input 
                  name="artist" 
                  placeholder="e.g. Taylor Swift, Various Artists" 
                  value={form.artist} 
                  onChange={handleChange} 
                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>  

          {/* --- Genre Select --- */}
          <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Music className="h-4 w-4 mr-2 text-primary-600" />
                  Genre
                </label>
                <Select
                  value={form.genreName}
                  onValueChange={(value) => setForm(prev => ({ ...prev, genreName: value }))}
                  disabled={dataLoading} // Disable while loading
                >
                  <SelectTrigger className="w-full text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder={dataLoading ? "Loading genres..." : "Select a genre"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-md">
                    {!dataLoading && genres.length === 0 && (
                      <SelectItem value="no-genres" disabled className="text-slate-500">
                        No genres found
                      </SelectItem>
                    )}
                  
                    {genres.map((genre) => (
                      <SelectItem
                        key={genre.id}
                        value={genre.name}
                        className="text-slate-800 focus:bg-slate-100 focus:text-slate-900 hover:bg-slate-100 hover:text-slate-900 cursor-pointer" // Add text, focus, hover styles
                      >
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
           
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                    Start Date & Time
                  </label>
                  <Input 
                    type="datetime-local" 
                    name="startDate" 
                    value={form.startDate} 
                    onChange={handleChange} 
                    className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Clock className="h-4 w-4 mr-2 text-primary-600" />
                    End Date & Time
                  </label>
                  <Input 
                    type="datetime-local" 
                    name="endDate" 
                    value={form.endDate} 
                    onChange={handleChange} 
                    className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
      <MapPin className="h-4 w-4 mr-2 text-primary-600" />
      Location
    </label>
    <Input 
      name="location" 
      placeholder="e.g. Madison Square Garden, New York" 
      value={form.location} 
      onChange={handleChange} 
      className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
    />
  </div>
  
       {/* --- Country Select --- */}
       <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                    Country
                  </label>
                  <Select
                    value={form.countryCode}
                    onValueChange={(value) => setForm(prev => ({ ...prev, countryCode: value }))}
                    disabled={dataLoading} // Disable while loading
                  >
                    <SelectTrigger className="w-full text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500">
                      <SelectValue placeholder={dataLoading ? "Loading countries..." : "Select a country"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-md">                   
                       {!dataLoading && countries.length === 0 && (
                         <SelectItem value="no-countries" disabled className="text-slate-500">
                           No countries found
                         </SelectItem>
                       )}        
                       {countries.map((country) => (
                        <SelectItem
                          key={country.id}
                          value={country.code}
                          className="text-slate-800 focus:bg-slate-100 focus:text-slate-900 hover:bg-slate-100 hover:text-slate-900 cursor-pointer" // Add text, focus, hover styles
                        >
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Users className="h-4 w-4 mr-2 text-primary-600" />
                  Total Seats
                </label>
                <Input 
                  type="number" 
                  name="seats" 
                  placeholder="e.g. 500" 
                  value={form.seats} 
                  onChange={handleChange} 
                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Image Upload Component */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <FileImage className="h-4 w-4 mr-2 text-primary-600" />
                  Event Image
                </label>
                
                {/* Hidden file input */}
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Custom upload button */}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 rounded-lg">
                  <div className="space-y-2 text-center">
                    <FileImage className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <Button
                        type="button"
                        onClick={handleImageUploadClick}
                        variant="secondary"
                        className="mx-auto"
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Event Image
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 p-2 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600">Image Preview:</p>
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImage}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="relative h-40 w-full bg-slate-100 rounded overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Event preview" 
                        className="h-full w-full object-cover"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Info className="h-4 w-4 mr-2 text-primary-600" />
                  Event Description
                </label>
                <Textarea 
                  name="description" 
                  placeholder="Describe your event..." 
                  value={form.description} 
                  onChange={handleChange} 
                  rows={4}
                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Ticket Tiers Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
                <h4 className="flex items-center font-medium text-gray-800 mb-1">
                  <Tag className="h-4 w-4 mr-2 text-primary-600" />
                  Ticket Tiers
                </h4>
                <p className="text-xs text-gray-500">Add different ticket types with their prices</p>
              </div>
              
              {ticketTiers.map((tier, index) => (
                <div key={index} className="mb-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium text-gray-700">Ticket Tier {index + 1}</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTicketTier(index)}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                      disabled={ticketTiers.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Tier Name</label>
                      <Input
                        value={tier.name}
                        onChange={(e) => handleTicketTierChange(index, 'name', e.target.value)}
                        placeholder="e.g. VIP, General Admission"
                        className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Price</label>
                      <Input
                        type="number"
                        value={tier.price}
                        onChange={(e) => handleTicketTierChange(index, 'price', e.target.value)}
                        placeholder="0"
                        className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addTicketTier}
                className="mt-2 w-full bg-slate-50 border-dashed border-slate-300 text-primary-600 hover:bg-slate-100 hover:text-primary-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Another Ticket Tier
              </Button>
            </div>
            
            {/* Create Event Button */}
            <div className="mt-8">
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group py-6"
              >
                <Save className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                {loading ? "Creating Event..." : "Create Event"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}