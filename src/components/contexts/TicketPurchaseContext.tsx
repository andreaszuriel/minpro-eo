import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
  } from 'react';
  import { useSession } from 'next-auth/react';
  import { useRouter } from 'next/navigation'; 
  import { DiscountType } from '@prisma/client';
  import {
    calculatePriceBreakdown,
    validatePointsInput,
    PriceCalculationInputs,
    PriceBreakdown as PriceBreakdownResult, 
    CouponInfo,
    PromotionInfo,
  } from '@/lib/price-calculations'; 
  import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';
  
  // --- Interface Definitions  ---
  export interface ConcertInfo {
    id: number;
    title?: string;
    startDate: string;
    time: string;
    seats: number;
    tiers: string[];
    price: Record<string, number>;
    currency: string;
  }
  
  export interface PointsData {
    currentBalance: number;
  }
  
  export interface CouponData {
    id: number;
    code: string;
    discount: number;
    discountType: DiscountType;
    expiresAt: string; 
    isReferral: boolean;
  }
  
  export interface UserProfileResponse {
    id: string;
    pointsData: PointsData | null;
    couponsData: CouponData[];
  }
  
  export interface PromotionData {
    id: string;
    code: string;
    discount: number;
    discountType: DiscountType;
    startDate: string | number | Date; // Keep flexible types
    endDate: string | number | Date;
  }
  
  // Use the PriceBreakdown interface from calculations
  export type PriceBreakdown = PriceBreakdownResult;
  
  const DEFAULT_PRICE_BREAKDOWN: PriceBreakdown = {
    basePrice: 0,
    couponDiscount: 0,
    promotionDiscount: 0,
    pointsDiscount: 0,
    subtotalBeforeTax: 0,
    taxAmount: 0,
    finalPrice: 0,
  };
  
  // --- Context Interface ---
  interface TicketPurchaseContextType {
    // Concert Info
    concert: ConcertInfo; // Make non-nullable if always provided
    // User Data & Auth
    sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
    userData: UserProfileResponse | null;
    isUserDataLoading: boolean;
    userDataError: string | null;
    // Selections
    selectedTier: string;
    setSelectedTier: (tier: string) => void;
    quantity: number;
    setQuantity: (quantity: number | ((prev: number) => number)) => void; // Allow function updates
    // Price Additions
    taxRate: number; // Keep tax rate if needed externally
    // Discount States & Actions
    selectedCouponId: string;
    setSelectedCouponId: (id: string) => void;
    availableCoupons: CouponData[]; // Derived list of coupons
    selectedCouponDetails: CouponData | undefined; // Derived details
    promoCodeInput: string;
    setPromoCodeInput: (code: string) => void;
    appliedPromotion: PromotionData | null;
    handleApplyPromo: () => Promise<void>; // Action
    isApplyingPromo: boolean;
    promoError: string | null;
    clearPromotion: () => void; // Action to remove applied promo
    pointsToUseInput: string;
    setPointsToUseInput: (points: string) => void; // Raw input
    pointsToUseValidated: number; // Validated points
    handlePointsInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Action
    handlePointsInputBlur: () => void; // Action
    availablePoints: number; // Derived available points
    // Price Breakdown
    priceBreakdown: PriceBreakdown;
    // Availability Info
    remainingSeats: number;
    isLowStock: boolean;
    currentTierPrice: number; // Derived price for selected tier
    // Helper Functions
    formatCurrency: (amount: number) => string;
    // Actions
    incrementQuantity: () => void;
    decrementQuantity: () => void;
    handlePurchase: () => void;
  }
  
  const TicketPurchaseContext = createContext<TicketPurchaseContextType | undefined>(
    undefined
  );
  
  export const TicketPurchaseProvider: React.FC<{
    children: ReactNode;
    concertData: ConcertInfo;
    initialTaxRate?: number; // Allow overriding default tax
  }> = ({ children, concertData, initialTaxRate = 0.1 }) => {
    const router = useRouter(); // Use router hook here
    const { data: session, status: sessionStatus } = useSession();
  
    // --- Base State ---
    const [concert] = useState<ConcertInfo>(concertData); // Initialized once
    const [userData, setUserData] = useState<UserProfileResponse | null>(null);
    const [isUserDataLoading, setIsUserDataLoading] = useState<boolean>(false);
    const [userDataError, setUserDataError] = useState<string | null>(null);
    const [selectedTier, setSelectedTierState] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [taxRate] = useState<number>(initialTaxRate); // Hardcoded 10%
  
    // --- Discount Input State ---
    const [selectedCouponId, setSelectedCouponId] = useState<string>('');
    const [promoCodeInput, setPromoCodeInput] = useState<string>('');
    const [appliedPromotion, setAppliedPromotion] = useState<PromotionData | null>(null);
    const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [pointsToUseInput, setPointsToUseInputState] = useState<string>('0'); 
  
    // --- Calculated/Derived State ---
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>(DEFAULT_PRICE_BREAKDOWN);
    const [remainingSeats, setRemainingSeats] = useState<number>(concert.seats ?? 0);
    const [isLowStock, setIsLowStock] = useState<boolean>(false);
  
    // --- Derived values (useMemo for optimization) ---
    const availableCoupons = useMemo(() => userData?.couponsData ?? [], [userData]);
    const selectedCouponDetails = useMemo(() =>
        availableCoupons.find(c => String(c.id) === selectedCouponId),
      [availableCoupons, selectedCouponId]
    );
    const availablePoints = useMemo(() => userData?.pointsData?.currentBalance ?? 0, [userData]);
    const pointsToUseValidated = useMemo(() =>
        validatePointsInput(pointsToUseInput, availablePoints),
      [pointsToUseInput, availablePoints]
    );
    const currentTierPrice = useMemo(() => concert.price?.[selectedTier] ?? 0, [concert, selectedTier]);
  
    // --- Helper Functions ---
     // Use the utility function, wrapped in useCallback for stability if passed down
     const formatCurrency = useCallback((amount: number): string => {
       const currencyCode = concert?.currency || 'IDR';
       return formatCurrencyUtil(amount, currencyCode);
     }, [concert?.currency]); 
  
    // --- State Reset Logic ---
    const resetDiscounts = useCallback(() => {
      setSelectedCouponId('');
      setPromoCodeInput('');
      setAppliedPromotion(null);
      setPromoError(null);
      // TODO: Keep points input or reset? U
      // setPointsToUseInputState('0');
    }, []);
  
    // --- Setters with Side-Effects ---
    const setSelectedTier = useCallback((tier: string) => {
      setSelectedTierState(tier);
      setQuantity(1); // Reset quantity when changing tier? Optional, but common.
      resetDiscounts(); // Reset discounts when tier changes
    }, [resetDiscounts]);
  
    const setPointsToUseInput = useCallback((value: string) => {
      // Allow only numbers in the input state
      const numericValue = value.replace(/[^0-9]/g, '');
      setPointsToUseInputState(numericValue || '0');
    }, []);
  
  
    // --- Fetch User Data ---
    useEffect(() => {
      const fetchUserData = async (userId: string) => {
        setIsUserDataLoading(true);
        setUserDataError(null);
        setUserData(null); // Clear previous data
        resetDiscounts(); // Also reset discounts when user changes
        setPointsToUseInputState('0'); // Reset points input on user change
        try {
          const response = await fetch(`/api/user/${userId}`); // Use environment variables for API routes
          if (!response.ok) throw new Error(`Failed to fetch user data (Status: ${response.status})`);
          const data: UserProfileResponse = await response.json();
          setUserData(data);
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserDataError(err instanceof Error ? err.message : "Could not load points/coupons.");
        } finally {
          setIsUserDataLoading(false);
        }
      };
  
      if (sessionStatus === 'authenticated' && session?.user?.id) {
        fetchUserData(session.user.id);
      } else if (sessionStatus === 'unauthenticated') {
        setUserData(null);
        setIsUserDataLoading(false);
        setUserDataError(null);
        resetDiscounts();
        setPointsToUseInputState('0');
      } else {
         setIsUserDataLoading(true); //  loading until authenticated/unauthenticated
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus, session?.user?.id, resetDiscounts]); // Add resetDiscounts to dependency array
  
    // --- Update Remaining Seats ---
    useEffect(() => {
      const seats = concert.seats ?? 0;
      setRemainingSeats(seats);
      setIsLowStock(seats > 0 && seats < 50); // Threshold could be configurable
    }, [concert.seats]);
  
    // --- Apply Promo Code ---
    const handleApplyPromo = useCallback(async () => {
      if (!promoCodeInput.trim() || !concert.id) return;
      setIsApplyingPromo(true);
      setPromoError(null);
      setAppliedPromotion(null); // Clear previous promo
      try {
        const response = await fetch(`/api/events/${concert.id}/promotions?eventId=${concert.id}&code=${promoCodeInput.trim()}`);
        if (!response.ok) {
             // Try to parse error message from response body if possible
            let errorMsg = 'Invalid promotional code';
             try {
                  const errorData = await response.json();
                  errorMsg = errorData.message || errorMsg;
             } catch (parseError) {
                 // Ignore if response isn't JSON
             }
            throw new Error(errorMsg);
        }
        const promotion: PromotionData = await response.json();
        const now = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        if (now < startDate || now > endDate) {
          throw new Error('Promotion is not active or has expired');
        }
        setAppliedPromotion(promotion);
        setPromoCodeInput(''); // Clear input on success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to apply promotional code';
        setPromoError(errorMessage);
        setAppliedPromotion(null); // Ensure promo is null on error
      } finally {
        setIsApplyingPromo(false);
      }
    }, [promoCodeInput, concert.id]);
  
    const clearPromotion = useCallback(() => {
        setAppliedPromotion(null);
        setPromoError(null);
        setPromoCodeInput(''); // Optionally clear input too
    }, []);
  
    // --- Handle Points Input ---
    const handlePointsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setPointsToUseInput(e.target.value); // Use the setter that filters non-numeric chars
    }, [setPointsToUseInput]);
  
    const handlePointsInputBlur = useCallback(() => {
      // Ensure the input reflects the validated value on blur
      setPointsToUseInputState(String(pointsToUseValidated));
    }, [pointsToUseValidated]);
  
    // --- Quantity Handlers ---
    const incrementQuantity = useCallback(() => {
      setQuantity((prev) => Math.min(prev + 1, 10, remainingSeats)); // Cap at 10 and remaining seats
    }, [remainingSeats]);
  
    const decrementQuantity = useCallback(() => {
      setQuantity((prev) => Math.max(1, prev - 1)); // Minimum 1
    }, []);
  
    // --- Price Calculation Effect ---
    useEffect(() => {
      const couponInfo: CouponInfo | undefined = selectedCouponDetails
        ? { discount: selectedCouponDetails.discount, discountType: selectedCouponDetails.discountType }
        : undefined;
  
      const promotionInfo: PromotionInfo | undefined = appliedPromotion
        ? { discount: appliedPromotion.discount, discountType: appliedPromotion.discountType }
        : undefined;
  
      const calculationInputs: PriceCalculationInputs = {
        unitPrice: currentTierPrice,
        quantity: quantity,
        coupon: couponInfo,
        promotion: promotionInfo,
        pointsToUse: pointsToUseValidated,
        taxRate: taxRate,
      };
  
      const newBreakdown = calculatePriceBreakdown(calculationInputs);
      setPriceBreakdown(newBreakdown);
  
    }, [
      currentTierPrice,
      quantity,
      selectedCouponDetails,
      appliedPromotion,
      pointsToUseValidated,
      taxRate,
    ]);
  
  
    // --- Handle Purchase ---
    const handlePurchase = useCallback(() => {
      if (!selectedTier || quantity <= 0 || currentTierPrice <= 0 || sessionStatus !== 'authenticated' || !session?.user?.id) {
        console.error("Purchase conditions not met:", { selectedTier, quantity, currentTierPrice, sessionStatus });
        // TODO show a user-facing error message
        return;
      }
  
      // Get fresh breakdown details for saving
      const finalBreakdown = priceBreakdown;
  
      const purchaseDataToSave = {
        eventId: concert.id,
        eventTitle: concert.title || "Concert Event",
        eventDate: concert.startDate,
        eventTime: concert.time,
        currency: concert.currency,
        tier: selectedTier,
        quantity: quantity,
        unitPrice: currentTierPrice,
        basePrice: finalBreakdown.basePrice,
        couponId: selectedCouponId ? parseInt(selectedCouponId, 10) : undefined,
        couponCode: selectedCouponDetails?.code,
        couponDiscountAmount: finalBreakdown.couponDiscount,
        pointsUsed: pointsToUseValidated, // Use the validated amount
        pointsDiscountAmount: finalBreakdown.pointsDiscount, // Use the calculated discount
        promotionCode: appliedPromotion?.code,
        promotionDiscountAmount: finalBreakdown.promotionDiscount,
        taxAmount: finalBreakdown.taxAmount,
        finalPrice: finalBreakdown.finalPrice,
        userId: session.user.id,
      };
  
      console.log("Saving Pending Purchase Data:", purchaseDataToSave);
      try {
          localStorage.setItem('pendingPurchase', JSON.stringify(purchaseDataToSave));
          router.push(`/purchase-confirmation?eventId=${concert.id}`);
      } catch (error) {
          console.error("Failed to save purchase data to localStorage:", error);
      }
    }, [
        selectedTier, quantity, currentTierPrice, sessionStatus, session?.user?.id,
        concert, priceBreakdown, selectedCouponId, selectedCouponDetails,
        pointsToUseValidated, appliedPromotion, router // Include router in dependencies
    ]);
  
  
    // --- Context Value ---
    const contextValue = useMemo((): TicketPurchaseContextType => ({
      // Pass down state and actions
      concert,
      sessionStatus,
      userData,
      isUserDataLoading,
      userDataError,
      selectedTier,
      setSelectedTier,
      quantity,
      setQuantity,
      taxRate,
      selectedCouponId,
      setSelectedCouponId,
      availableCoupons,
      selectedCouponDetails,
      promoCodeInput,
      setPromoCodeInput,
      appliedPromotion,
      handleApplyPromo,
      isApplyingPromo,
      promoError,
      clearPromotion,
      pointsToUseInput,
      setPointsToUseInput,
      pointsToUseValidated,
      handlePointsInputChange,
      handlePointsInputBlur,
      availablePoints,
      priceBreakdown,
      remainingSeats,
      isLowStock,
      currentTierPrice,
      formatCurrency,
      incrementQuantity,
      decrementQuantity,
      handlePurchase,
    }), [
        // List all dependencies for the context value
        concert, sessionStatus, userData, isUserDataLoading, userDataError,
        selectedTier, setSelectedTier, quantity, taxRate, selectedCouponId,
        setSelectedCouponId, availableCoupons, selectedCouponDetails, promoCodeInput, setPromoCodeInput,
        appliedPromotion, handleApplyPromo, isApplyingPromo, promoError, clearPromotion, pointsToUseInput,
        setPointsToUseInput, pointsToUseValidated, handlePointsInputChange, handlePointsInputBlur,
        availablePoints, priceBreakdown, remainingSeats, isLowStock, currentTierPrice,
        formatCurrency, incrementQuantity, decrementQuantity, handlePurchase
    ]);
  
    return (
      <TicketPurchaseContext.Provider value={contextValue}>
        {children}
      </TicketPurchaseContext.Provider>
    );
  };
  
  // --- Custom Hook ---
  export const useTicketPurchase = (): TicketPurchaseContextType => {
    const context = useContext(TicketPurchaseContext);
    if (context === undefined) {
      throw new Error('useTicketPurchase must be used within a TicketPurchaseProvider');
    }
    return context;
  };