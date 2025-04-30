// components/skeletons/ConcertDetailSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ConcertDetailSkeleton() {
  return (
    <main className="bg-slate-100 flex flex-col min-h-screen">
      {/* Hero Image Skeleton */}
      <Skeleton className="relative w-full h-[50vh] bg-gray-300" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Description Skeleton */}
          <div className="w-full md:w-2/3 mb-8 md:mb-0 order-2 md:order-1 space-y-4">
            <Skeleton className="h-8 w-3/4 bg-gray-300" />
            <Skeleton className="h-6 w-1/2 bg-gray-300" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
              <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <Skeleton className="h-5 w-full bg-gray-200" />
            <Skeleton className="h-5 w-full bg-gray-200" />
            <Skeleton className="h-20 w-full bg-gray-200" />
            <Skeleton className="h-6 w-1/4 bg-gray-300" />
            <Skeleton className="h-10 w-1/2 bg-gray-200" />
          </div>
          {/* Ticket Box Skeleton */}
          <div className="w-full md:w-1/3 order-1 md:order-2">
            <Skeleton className="h-[500px] w-full bg-white rounded-xl shadow-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}