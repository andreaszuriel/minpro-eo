"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatISO, parseISO } from "date-fns"; 
import { Toaster, toast } from 'sonner';
import { eventFormSchema, EventFormData } from "@/lib/validation/event.schema"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
  AlertCircle,
  ArrowLeft
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
import Link from "next/link"; 

// Interface matching the expected GET /api/events/[id] response structure
interface FetchedEventData {
  id: number;
  title: string;
  artist: string;
  startDate: string; // ISO String
  endDate: string;   // ISO String
  location: string;
  seats: number;
  description: string | null;
  image: string | null;
  organizerId: string;
  genre: { name: string };
  country: { code: string; name: string }; 
  price: Record<string, number>; // Price object from API
}

// Helper to format ISO string for datetime-local input
const formatDateTimeLocal = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return "";
  }
};

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const eventId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [genres, setGenres] = useState<{ id: number, name: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number, name: string, code: string }[]>([]);
  const [dataLoading, setDataLoading] = useState(true); // For genres/countries
  const [eventLoading, setEventLoading] = useState(true); // For specific event data
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false); // For form submission state
  const [fetchError, setFetchError] = useState<string | null>(null); // For event fetch error

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
      organizerId: "", // Will be set from fetched data
      tiers: [{ name: "General", price: 0 }] // Default tier
    }
  });

  // Use field array for dynamic ticket tiers
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tiers"
  });

  // Fetch initial data (genres, countries)
  useEffect(() => {
    const fetchDropdownData = async () => {
      setDataLoading(true);
      try {
        const [genresResponse, countriesResponse] = await Promise.all([
          fetch('/api/genres'),
          fetch('/api/countries')
        ]);

        if (genresResponse.ok) {
          setGenres(await genresResponse.json());
        } else {
          console.error("Failed to fetch genres");
          toast.error("Failed to load genres");
          setGenres([]);
        }

        if (countriesResponse.ok) {
          setCountries(await countriesResponse.json());
        } else {
          console.error("Failed to fetch countries");
          toast.error("Failed to load countries");
          setCountries([]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load required data");
        setGenres([]);
        setCountries([]);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch event data and reset form
  const resetFormWithData = useCallback((eventData: FetchedEventData) => {
     // Convert price object to tiers array
     const fetchedTiers = Object.entries(eventData.price || {}).map(([name, price]) => ({
      name,
      price: Number(price) || 0,
    }));

    form.reset({
      title: eventData.title,
      artist: eventData.artist,
      genreName: eventData.genre?.name || "",
      countryCode: eventData.country?.code || "", // Make sure API sends 'code'
      startDate: formatDateTimeLocal(eventData.startDate),
      endDate: formatDateTimeLocal(eventData.endDate),
      location: eventData.location,
      seats: eventData.seats || 0,
      description: eventData.description || "",
      image: eventData.image || "",
      organizerId: eventData.organizerId, // Set organizerId
      tiers: fetchedTiers.length > 0 ? fetchedTiers : [{ name: "General", price: 0 }], // Use fetched tiers or default
    });

    // Set image preview if exists
    if (eventData.image) {
      setImagePreview(eventData.image);
    } else {
      setImagePreview(null);
    }
  }, [form]); // Include form in dependencies


  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      setEventLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch event (status: ${response.status})`);
        }
        const eventData: FetchedEventData = await response.json();
        resetFormWithData(eventData); // Populate form
      } catch (error: any) {
        console.error("Error fetching event data:", error);
        setFetchError(error.message || "An unknown error occurred while fetching event details.");
        toast.error("Failed to load event data", { description: error.message });
      } finally {
        setEventLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, resetFormWithData]); // Add resetFormWithData dependency


  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", { description: "Please upload an image file." });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!response.ok) throw new Error('Image upload failed');

      const data = await response.json();
      form.setValue("image", data.url, { shouldValidate: true }); // Set value and trigger validation
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload image", { description: "Please try again." });
      // Revert preview if upload failed and original image existed
      const originalImage = form.getValues("image");
      if (originalImage) {
        setImagePreview(originalImage);
      } else {
        clearImage(); // Clear if there was no original image
      }
    } finally {
      setUploadingImage(false);
      // Clean up object URL
      if (objectUrl && !form.getValues("image")) { // Only revoke if upload failed or cleared
         URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const clearImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview); // Revoke blob URL
    }
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
    setSubmitting(true);

    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      // Ensure payload matches what the PUT API expects (using validated data)
      const payload = {
        ...data,
        startDate: formatISO(start),
        endDate: formatISO(end),
        seats: Number(data.seats),
      };

      console.log("Sending Update Payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/events/${eventId}`, { // Use eventId in URL
        method: "PUT", // Use PUT method
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorDescription = "Please check details and try again.";
        try {
          const errorData = await res.json();
          console.error("Failed to update event - Server Response:", errorData);
          if (errorData.error) errorDescription = errorData.error;
          if (errorData.details) { // Handle Zod validation errors from API
             errorDescription += ` ${JSON.stringify(errorData.details)}`;
          }
        } catch (parseError) {
          const errorText = await res.text();
          console.error("Failed to update event - Server Response (Non-JSON):", errorText);
          errorDescription = errorText.substring(0, 100);
        }
        toast.error("Failed to update event", { description: errorDescription });
      } else {
        toast.success("Event Updated!", {
          description: "Your event details have been saved.",
        });
        // Redirect to dashboard or event detail page
        const organizerDashboardId = form.getValues("organizerId") || 'default'; // Fallback needed
        router.push(`/dashboard/${organizerDashboardId}`);
      }
    } catch (err) {
      console.error("Client-side error during handleSubmit:", err);
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formErrors = Object.keys(form.formState.errors).length > 0;

  // Render Loading State
  if (eventLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="ml-4 text-lg text-gray-600">Loading Event Data...</p>
      </div>
    );
  }

  // Render Fetch Error State
  if (fetchError) {
    return (
      <div className="mx-auto max-w-3xl mt-12 py-8 px-4 sm:px-6">
         <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                Error loading event: {fetchError}
                <Link href={`/dashboard/${form.getValues("organizerId") || 'default'}`} className="ml-2 underline">Go back to dashboard</Link>
            </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-3xl mt-12 mb-12 py-8 px-4 sm:px-6"> 
         {/* Back Button */}
         <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

        <div className="bg-white rounded-xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
            <div className="flex items-center">
              <div className="bg-white text-primary-700 rounded-full p-2 mr-3 shadow-lg">
                <Music className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold">Edit Event</h1> {/* Changed Title */}
            </div>
            <p className="mt-2 text-primary-100 text-sm">Update the details for your event below</p> {/* Changed Subtitle */}
          </div>

          <div className="p-6">
            {/* Form errors summary */}
            {formErrors && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please correct the errors below before saving changes.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* --- Form Fields (Identical structure to Create Page) --- */}

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
                        value={field.value || ""} // Handle potential null/undefined value
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
                           {/* TODO: Add an empty option if needed */}
                           {/* <SelectItem value="" disabled>Select a genre</SelectItem> */}
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
                          value={field.value || ""} // Handle potential null/undefined value
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
                            {/* TODO: Add an empty option if needed */}
                           {/* <SelectItem value="" disabled>Select a country</SelectItem> */}
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

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

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
                              {imagePreview ? 'Change Image' : 'Upload Image'}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>

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
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="relative h-40 w-full bg-slate-100 rounded overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="h-full w-full object-cover"
                          onError={() => {
                            console.warn("Image preview failed to load:", imagePreview);
                            // TODO: clear preview if src is invalid
                            // setImagePreview(null);
                            // form.setValue("image", "");
                          }}
                        />
                      </div>
                    </div>
                  )}
                   {/* Hidden field for image URL - necessary for validation */}
                   <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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

                {/* Ticket Tiers Section (Identical structure) */}
                 <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
                    <h4 className="flex items-center font-medium text-gray-800 mb-1">
                      <Tag className="h-4 w-4 mr-2 text-primary-600" />
                      Ticket Tiers
                    </h4>
                    <p className="text-xs text-gray-500">Edit ticket types and their prices</p>
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
                          aria-label={`Remove tier ${index + 1}`}
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
                                   min="0" // Add min attribute
                                  step="any" // Allow decimals if needed
                                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                                  {...field}
                                  // Ensure value is treated as number
                                  onChange={(e) => {
                                      const value = e.target.value;
                                      // Allow empty string, otherwise parse as float/int
                                      field.onChange(value === '' ? '' : parseFloat(value) || 0);
                                  }}
                                   value={field.value ?? ''} // Handle potential null/undefined
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

                {/* Save Changes Button */}
                <div className="mt-8">
                  <Button
                    type="submit"
                    disabled={submitting || eventLoading || dataLoading} // Disable during loads/submit
                    className="w-full bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group py-6"
                  >
                    {submitting ? (
                       <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving Changes...
                       </>
                    ) : (
                       <>
                          <Save className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                          Save Changes 
                       </>
                    )}

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