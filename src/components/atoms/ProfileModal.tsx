import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from 'sonner';
import {
  User,
  Mail,
  Info,
  Key,
  Save,
  XCircle,
  Shield,
  EyeOff,
  Eye
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  handleProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateProfile: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  profileData,
  handleProfileChange,
  updateProfile
}: ProfileModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveChanges = (e: React.MouseEvent<HTMLButtonElement>) => {
    updateProfile(e);
    toast.success("Profile Updated", {
      description: "Your profile changes have been saved successfully.",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl overflow-hidden bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5">
        {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white text-primary-700 rounded-full p-2 mr-3 shadow-lg">
                  <User className="h-5 w-5" />
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

          <div className="p-6">
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
            </div>

           {/* Password Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
                <h4 className="flex items-center font-medium text-gray-800 mb-1">
                  <Shield className="h-4 w-4 mr-2 text-primary-600" />
                  Change Password
                </h4>
                <p className="text-xs text-gray-500">Leave blank if you don't want to change your password</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Key className="h-4 w-4 mr-2 text-primary-600" />
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={profileData.currentPassword}
                      onChange={handleProfileChange}
                      className="text-black border-slate-200 bg-slate-50 pr-10 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Key className="h-4 w-4 mr-2 text-primary-600" />
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={profileData.newPassword}
                      onChange={handleProfileChange}
                      className="text-black border-slate-200 bg-slate-50 pr-10 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Key className="h-4 w-4 mr-2 text-primary-600" />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      className="text-black border-slate-200 bg-slate-50 pr-10 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
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
                className="bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group"
              >
                <Save className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
