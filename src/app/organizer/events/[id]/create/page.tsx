"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatISO } from "date-fns";
import { Toaster, toast } from 'sonner';
import { eventFormSchema, EventFormData, ticketTierSchema } from "@/lib/validation/event.schema"; // Import the schema
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
  X,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
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
      organizerId: organizerId,
      tiers: [{ name: "General", price: 0 }]
    }
  });

  // Use field array for dynamic ticket tiers
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers"
  });

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
      form.setValue("image", data.url);
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
    form.setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addTicketTier = () => {
    append({ name: "", price: 0 });
  };

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);

    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const payload = {
        ...data,
        startDate: formatISO(start),
        endDate: formatISO(end),
        seats: Number(data.seats),
        price: data.tiers, // Keep price for backward compatibility
      };

      console.log("Sending Payload:", JSON.stringify(payload, null, 2));

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
      setDataLoading(true);
      try {
        // Fetch genres
        const genresResponse = await fetch('/api/genres');
        if (genresResponse.ok) {
          const genresData = await genresResponse.json();
          setGenres(genresData); 
        } else {
           console.error("Failed to fetch genres");
           toast.error("Failed to load genres");
           setGenres([]);
        }

        // Fetch countries
        const countriesResponse = await fetch('/api/countries');
        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData);
        } else {
           console.error("Failed to fetch countries");
           toast.error("Failed to load countries");
           setCountries([]); 
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
        setGenres([]);
        setCountries([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if there are any form errors
  const formErrors = Object.keys(form.formState.errors).length > 0;

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
            {/* Form errors summary */}
            {formErrors && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please correct the errors below before submitting the form.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Basic Info */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                        <Tag className="h-4 w-4 mr-2 text-primary-600" />
                        Event Title
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Summer Music Festival 2025" 
                          className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                        <Users className="h-4 w-4 mr-2 text-primary-600" />
                        Artist/Performer
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Taylor Swift, Various Artists" 
                          className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genreName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                        <Music className="h-4 w-4 mr-2 text-primary-600" />
                        Genre
                      </FormLabel>
                      <Select 
                        disabled={dataLoading}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500">
                            <SelectValue placeholder={dataLoading ? "Loading genres..." : "Select a genre"} />
                          </SelectTrigger>
                        </FormControl>
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
                              className="text-slate-800 focus:bg-slate-100 focus:text-slate-900 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              {genre.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                          <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                          Start Date & Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                          <Clock className="h-4 w-4 mr-2 text-primary-600" />
                          End Date & Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Madison Square Garden, New York" 
                            className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                          Country
                        </FormLabel>
                        <Select 
                          disabled={dataLoading}
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500">
                              <SelectValue placeholder={dataLoading ? "Loading countries..." : "Select a country"} />
                            </SelectTrigger>
                          </FormControl>
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
                                className="text-slate-800 focus:bg-slate-100 focus:text-slate-900 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                              >
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                        <Users className="h-4 w-4 mr-2 text-primary-600" />
                        Total Seats
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 500" 
                          className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                        <Info className="h-4 w-4 mr-2 text-primary-600" />
                        Event Description
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event..." 
                          rows={4}
                          className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Ticket Tiers Section */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
                    <h4 className="flex items-center font-medium text-gray-800 mb-1">
                      <Tag className="h-4 w-4 mr-2 text-primary-600" />
                      Ticket Tiers
                    </h4>
                    <p className="text-xs text-gray-500">Add different ticket types with their prices</p>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="mb-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-gray-700">Ticket Tier {index + 1}</h5>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fields.length > 1 && remove(index)}
                          className="text-red-500 hover:text-red-700 p-1 h-auto"
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`tiers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600">Tier Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. VIP, General Admission"
                                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`tiers.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600">Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
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
                    type="submit"
                    disabled={loading} 
                    className="w-full bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group py-6"
                  >
                    <Save className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    {loading ? "Creating Event..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}