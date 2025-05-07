"use client";

import { Music, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle the create concert button click
  const handleCreateConcert = () => {
    // If user is not authenticated, redirect to sign in
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Check if user exists and has a role
    if (session?.user) {
      // If user is an organizer, redirect to the create page
      if (session.user.role === "organizer") {
        router.push(`/organizer/events/${session.user.id}/create`);
      } else {
        // If user is a customer, show a toast message
        toast.error("You need to be an Organizer to use this feature");
      }
    }
  };

  return (
    <section className="relative flex h-[75vh] flex-col items-center justify-center px-4">
      {/* Background Image with optimized loading */}
      <Image
        src="https://i.pinimg.com/1200x/7d/23/8a/7d238a7b8107aad201592de890356993.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        quality={85}
        aria-hidden="true"
      />
      
      {/* Dimming Overlay */}
      <div className="absolute inset-0 bg-black/70" aria-hidden="true"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
          One-stop platform for concerts
          <br className="hidden md:block" />
          <span className="text-primary-600">attenders</span> and{" "}
          <span className="text-primary-600">organizers</span>
        </h1>

        <p className="mb-10 text-lg text-gray-300 md:text-xl">
          Share your passion by joining a concert or
          <br className="hidden md:block" />
          create a new concert to be shared with others
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link 
            href="/events" 
            className="flex items-center justify-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-400 min-w-[180px]"
          >
            <Music size={20} aria-hidden="true" />
            <span>View Concerts</span>
          </Link>

          <Button
            onClick={handleCreateConcert}
            className="text-lg py-6 flex items-center justify-center gap-2 rounded-md bg-transparent border border-primary-300 px-6 text-primary-300 transition-colors hover:bg-primary-100 hover:text-white min-w-[180px]"
          >
            <Calendar size={20} aria-hidden="true" />
            <span>Create Concerts</span>
          </Button>
        </div>
      </div>
    </section>
  );
}