'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  XCircle, Tag, Loader2, Edit, Trash,
  CircleCheck, Plus, CalendarRange, Check, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { toast } from 'sonner';

type Promotion = {
  id: string;
  code: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

interface CouponManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
  eventTitle: string;
}

const CouponManagementModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle
}: CouponManagementModalProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    id: '',
    code: '',
    discount: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    startDate: '',
    endDate: '',
    usageLimit: '',
    description: '',
    isActive: true,
  });

  // Fetch promotions when modal opens
  useEffect(() => {
    if (isOpen && eventId) {
      fetchPromotions();
    }
  }, [isOpen, eventId]);

  const fetchPromotions = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/promotions`);
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromotion.code,
          discount: parseFloat(newPromotion.discount),
          discountType: newPromotion.discountType,
          startDate: newPromotion.startDate,
          endDate: newPromotion.endDate,
          usageLimit: newPromotion.usageLimit ? parseInt(newPromotion.usageLimit) : null,
          description: newPromotion.description || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error.includes("Promotion code already exists")) {
          toast.error("This promotion code is already in use. Please choose a different code.");
        } else {
          throw new Error(errorData.error || 'Failed to create promotion');
        }
        return;
      }

      const createdPromotion = await response.json();
      setPromotions([...promotions, createdPromotion]);
      toast.success("Promotion created successfully", {
        icon: <CircleCheck className="h-5 w-5" />,
      });
      resetPromotionForm();
    } catch (error) {
      console.error("Error creating promotion:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create promotion", {
        icon: <XCircle className="h-5 w-5" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setIsEditing(true);
    setNewPromotion({
      id: promotion.id,
      code: promotion.code,
      discount: promotion.discount.toString(),
      discountType: promotion.discountType,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      usageLimit: promotion.usageLimit?.toString() || '',
      description: promotion.description || '',
      isActive: promotion.isActive,
    });
  };

  const handleUpdatePromotion = async () => {
    if (!eventId || !newPromotion.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/promotions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPromotion.id,
          code: newPromotion.code,
          discount: parseFloat(newPromotion.discount),
          discountType: newPromotion.discountType,
          startDate: newPromotion.startDate,
          endDate: newPromotion.endDate,
          usageLimit: newPromotion.usageLimit ? parseInt(newPromotion.usageLimit) : null,
          description: newPromotion.description || null,
          isActive: newPromotion.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update promotion');
      }

      const updatedPromotion = await response.json();
      setPromotions(
        promotions.map((p) => (p.id === updatedPromotion.id ? updatedPromotion : p))
      );
      toast.success("Promotion updated successfully", {
        icon: <CircleCheck className="h-5 w-5" />,
      });
      resetPromotionForm();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating promotion:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update promotion", {
        icon: <XCircle className="h-5 w-5" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (!eventId) return;

    setIsDeleting(promotionId);
    try {
      const response = await fetch(`/api/events/${eventId}/promotions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promotionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete promotion');
      }

      setPromotions(promotions.filter((p) => p.id !== promotionId));
      toast.success("Promotion deleted successfully", {
        icon: <Check className="h-5 w-5" />,
      });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete promotion", {
        icon: <XCircle className="h-5 w-5" />,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const resetPromotionForm = () => {
    setNewPromotion({
      id: '',
      code: '',
      discount: '',
      discountType: 'PERCENTAGE',
      startDate: '',
      endDate: '',
      usageLimit: '',
      description: '',
      isActive: true,
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl overflow-hidden bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3 shadow-lg">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Coupon Management</h3>
                <p className="text-sm text-white/80">{eventTitle}</p>
              </div>
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Create/Edit Form Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <h4 className="flex items-center text-gray-800 font-medium mb-4">
              <Plus className="h-4 w-4 mr-2 text-primary-600" />
              {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm text-gray-700">Promotion Code</Label>
                  <Input
                    id="code"
                    value={newPromotion.code}
                    onChange={(e) => setNewPromotion({ ...newPromotion, code: e.target.value })}
                    className="border-slate-300 focus-visible:ring-primary-500 text-black"
                    placeholder="e.g., SUMMER2025"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discountType" className="text-sm text-gray-700">Discount Type</Label>
                  <Select
                    value={newPromotion.discountType}
                    onValueChange={(value) => setNewPromotion({ ...newPromotion, discountType: value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                  >
                    <SelectTrigger className="text-black w-full border-slate-300 focus-visible:ring-primary-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="text-black bg-slate-50">
                      <SelectItem className="cursor-pointer hover:bg-white hover:text-primary-600" value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem className="cursor-pointer hover:bg-white hover:text-primary-600" value="FIXED_AMOUNT">Fixed Amount (IDR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-sm text-gray-700">Discount Value</Label>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      value={newPromotion.discount}
                      onChange={(e) => setNewPromotion({ ...newPromotion, discount: e.target.value })}
                      className="border-slate-300 focus-visible:ring-primary-500 pl-8 text-black"
                      placeholder={newPromotion.discountType === 'PERCENTAGE' ? "e.g., 20" : "e.g., 100000"}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {newPromotion.discountType === 'PERCENTAGE' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usageLimit" className="text-sm text-gray-700">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={newPromotion.usageLimit}
                    onChange={(e) => setNewPromotion({ ...newPromotion, usageLimit: e.target.value })}
                    className="border-slate-300 focus-visible:ring-primary-500 text-black"
                    placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm text-gray-700">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({ ...newPromotion, startDate: e.target.value })}
                    className="border-slate-300 focus-visible:ring-primary-500 text-black"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm text-gray-700">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({ ...newPromotion, endDate: e.target.value })}
                    className="border-slate-300 focus-visible:ring-primary-500 text-black"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm text-gray-700">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
                    className="border-slate-300 focus-visible:ring-primary-500 text-black"
                    placeholder="e.g., Summer Special Offer"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={resetPromotionForm}
                className="border-slate-300 text-gray-700 hover:bg-slate-100"
              >
                Reset Form
              </Button>
              
              <Button
                onClick={isEditing ? handleUpdatePromotion : handleCreatePromotion}
                disabled={isSubmitting}
                className="bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update Promotion' : 'Create Promotion'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Promotions Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="flex items-center text-gray-800 font-medium mb-4">
              <Tag className="h-4 w-4 mr-2 text-primary-600" />
              Existing Promotions
            </h4>
            
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : promotions.length === 0 ? (
              <div className="py-8 text-center">
                <Tag className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-3 text-gray-500 font-medium">No promotions found</p>
                <p className="text-sm text-gray-400">Create your first promotion using the form above</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {promotions.map((promotion) => (
                  <div 
                    key={promotion.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <span className="bg-primary-100 text-primary-700 font-mono font-bold px-2 py-0.5 text-sm rounded-md">
                          {promotion.code}
                        </span>
                        {promotion.isActive ? (
                          <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 text-xs rounded-full font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 text-xs rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        {promotion.description && (
                          <p className="font-medium truncate mb-1">{promotion.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Percent className="mr-1 h-3 w-3" />
                            {promotion.discountType === 'PERCENTAGE' 
                              ? `${promotion.discount}% off` 
                              : `${promotion.discount.toLocaleString('id-ID')} IDR off`
                            }
                          </div>
                          <div className="flex items-center">
                            <CalendarRange className="mr-1 h-3 w-3" />
                            {format(new Date(promotion.startDate), 'MMM d')} - {format(new Date(promotion.endDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Tag className="mr-1 h-3 w-3" />
                            Used: {promotion.usageCount}/{promotion.usageLimit || '∞'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2 sm:mt-0 ml-auto space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPromotion(promotion)}
                        className="h-8 w-8 p-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromotion(promotion.id)}
                        disabled={isDeleting === promotion.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isDeleting === promotion.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-gray-700 border border-slate-300"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponManagementModal;