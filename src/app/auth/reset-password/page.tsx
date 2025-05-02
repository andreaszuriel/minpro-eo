'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { Loader2, Key, AlertTriangle, CircleCheck, Eye, EyeOff, LockKeyhole } from 'lucide-react'; // Added icons

// Wrap the component that uses useSearchParams in Suspense
function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for password visibility
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    useEffect(() => {
        if (!token) {
            setError("No reset token found in URL or it might be invalid. Please request a new reset link.");
            // Optional: redirect after a delay
            // setTimeout(() => router.push('/auth/signin'), 5000);
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        // Keep success message until redirect orr clear it:
        // setSuccess(null);

        if (!token) {
             setError("Invalid request. Cannot process reset without a token.");
             return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            toast.error("Input Error", { description: "Passwords do not match." });
            return;
        }
        // Add a minimum length check consistent with backend (e.g., 6 chars)
        if (newPassword.length < 6) {
             setError("Password must be at least 6 characters long.");
             toast.error("Input Error", { description: "Password must be at least 6 characters long." });
            return;
        }
        // TODO: Add more complex password requirement

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to reset password. The link might be expired or invalid.");
            }

            setSuccess(data.message || "Password reset successfully!");
            toast.success("Success!", { description: data.message });
            setNewPassword('');
            setConfirmPassword('');
            // Redirect to login after a short delay
            setTimeout(() => router.push('/auth/signin'), 3000);

        } catch (err) {
             const message = err instanceof Error ? err.message : "An unexpected error occurred.";
             setError(message);
             toast.error("Reset Failed", { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while checking token
    if (!token && !error) {
        return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" /></div>;
    }

    return (
      // Centering container for the page
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
        {/* Card matching modal style */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">

             {/* Header Section  */}
             <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                 <h1 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
                   <LockKeyhole className="w-6 h-6 mr-3 text-primary-600" />
                   Reset Your Password
                 </h1>
                 <p className="text-sm text-gray-500 text-center mt-1">
                    Enter and confirm your new password below.
                 </p>
             </div>

            {/* Form Area */}
            <div className="p-6 md:p-8">
                {/* Error Message Styling */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {/* Success Message Styling */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 text-sm flex items-start">
                        <CircleCheck className="h-5 w-5 mr-2 flex-shrink-0" />
                         <span>
                           {success} Redirecting to login shortly...
                         </span>
                    </div>
                )}

                {/* Show form only if token is valid and not yet successful */}
                {!success && token && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password Input */}
                        <div>
                            <label
                                htmlFor="newPassword"
                                className="flex items-center text-sm font-medium text-gray-700 mb-1"
                            >
                                <Key className="h-4 w-4 mr-2 text-primary-600" />
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500 pr-10" // Added pr-10
                                    minLength={6}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                         {/* Confirm New Password Input */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="flex items-center text-sm font-medium text-gray-700 mb-1"
                             >
                                <Key className="h-4 w-4 mr-2 text-primary-600" />
                                Confirm New Password
                            </label>
                             <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500 pr-10" // Added pr-10
                                    minLength={6}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                         {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                             className="w-full bg-secondary-600 hover:bg-secondary-700 text-white transition-all shadow-lg shadow-secondary-500/20 group py-2.5" // Added py-2.5 for height
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                </>
                             ) : (
                                'Reset Password'
                             )}
                        </Button>
                    </form>
                 )}

                {/* Link to request new token if initial token was bad */}
                 {!success && error && !token && (
                      <div className="text-center mt-6">
                           <p className="text-sm text-gray-600 mb-2">{error}</p>
                           <Button
                                variant="outline"
                                onClick={() => router.push('/auth/forgot-password')} // Assuming this page exists
                                className="border-primary-300 text-primary-600 hover:bg-primary-50"
                            >
                                Request New Reset Link
                            </Button>
                      </div>
                 )}
            </div>
        </div>
      </div>
    );
}


// Main page component using Suspense
export default function ResetPasswordPage() {
    return (
        // Suspense is crucial for useSearchParams
        <Suspense fallback={
             <div className="min-h-screen flex items-center justify-center bg-slate-100">
                 <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            </div>
        }>
             {/* Toaster for feedback */}
             <Toaster position="top-center" richColors closeButton />
            <ResetPasswordContent />
        </Suspense>
    );
}