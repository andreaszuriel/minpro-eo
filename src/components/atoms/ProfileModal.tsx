import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from 'sonner';
import {
  User,
  Mail,
  Info,
  Save,
  XCircle,
  Upload,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: {
    name: string;
    email: string;
    image?: string;
  };
  handleProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateProfile: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean; 
  profileUpdateLoading: boolean;
}

export default function ProfileModal({
  isOpen,
  onClose,
  profileData,
  handleProfileChange,
  updateProfile,
  profileUpdateLoading 
}: ProfileModalProps) {
  
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(profileData.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", {
        description: "Please upload an image file (JPEG, PNG, etc.)",
      });
      return;
    }

    // Create a temporary preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Prepare form data for upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      
      // Send the image to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update the profile data with the new image URL
      const imageChangeEvent = {
        target: {
          name: 'image',
          value: data.url
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleProfileChange(imageChangeEvent);
      
      toast.success("Image uploaded", {
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Failed to upload your image",
      });
      
      // Reset preview if upload failed
      if (profileData.image) {
        setImagePreview(profileData.image);
      } else {
        setImagePreview(null);
      }
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = (e: React.MouseEvent<HTMLButtonElement>) => {
    updateProfile(e);
    toast.success("Profile Updated", {
      description: "Your profile changes have been saved successfully.",
    });
  };

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profileData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Use backend message if available, otherwise generic
        throw new Error(data.message || "Failed to send reset link.");
      }

      // Show the generic success message from the backend
      toast.info("Password Reset Email Sent", {
        description: data.message, // Display the message from the API
        duration: 6000,
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Could not send reset link.",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl overflow-hidden bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 flex flex-col max-h-[90vh]"> 
        {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="border-2 border-white text-primary-700 rounded-full  mr-3 shadow-lg overflow-hidden">
                  {imagePreview ? (
                    <Image 
                      src={imagePreview} 
                      alt="Profile" 
                      width={20} 
                      height={20} 
                      className="h-12 w-12 object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-2 w-2" />
                  )}
                </div>
                <h3 className="text-xl font-bold">Edit Profile</h3>
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

          {/* Content Area*/}
          <div className="p-6 overflow-y-auto">
           {/* Basic Info */}
            <div className="space-y-5">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 mr-2 text-primary-600" />
                  Display Name
                </label>
                <Input
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="text-black border-slate-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 mr-2 text-primary-600" />
                  Email Address
                </label>
                <Input
                  value={profileData.email}
                  disabled
                  className="border-slate-200 bg-slate-100 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Email cannot be changed
                </p>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <ImageIcon className="h-4 w-4 mr-2 text-primary-600" />
                  Profile Picture
                </label>
                
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {imagePreview ? (
                        <Image 
                          src={imagePreview} 
                          alt="Profile" 
                          width={64} 
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <Button
                      type="button"
                      onClick={triggerFileUpload}
                      disabled={uploading}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-gray-700 border border-slate-200 hover:border-slate-300"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Picture'}
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      JPEG, PNG or GIF (max 2MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

      {/* Password Section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3">
                 <h4 className="flex items-center font-medium text-gray-800 mb-1">
                   Password Management
                 </h4>
                 <p className="text-xs text-gray-500">Need to reset your password?</p>
               </div>
               <Button
                 variant="outline"
                 onClick={handleForgotPassword}
                 disabled={forgotPasswordLoading}
                 className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
               >
                 {forgotPasswordLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                   </>
                 ) : (
                   'Send Password Reset Link'
                 )}
               </Button>
            </div>
            {/* Cancel or Save */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 text-gray-700 bg-slate-100 hover:bg-red-400 hover:text-white "
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={profileUpdateLoading || uploading || forgotPasswordLoading} // Disable if any action is loading
                className="bg-secondary-600 hover:bg-secondary-700 ..."
              >
                {profileUpdateLoading ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                     <Save className="mr-2 h-4 w-4 ..." />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}