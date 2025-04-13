import React from "react";
import { Music, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="h-[75vh] flex flex-col items-center justify-center px-4 relative">
      {/* Background Image */}
      <Image
        src="https://i.pinimg.com/1200x/7d/23/8a/7d238a7b8107aad201592de890356993.jpg"
        alt="Concert background"
        fill
        className="object-cover"
        priority
      />
      {/* Dimming Overlay */}
      <div className="absolute inset-0 bg-black/70 dark:bg-black/70"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-white text-4xl md:text-6xl font-bold text-center mb-6">
          One-stop platform for concerts
          <br className="hidden md:block" />
          <span className="text-primary-600">attenders</span> and{" "}
          <span className="text-primary-600">organizers</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 dark:text-gray-300 text-center mb-10">
          Share your passion by joining a concert or
          <br className="hidden md:block" />
          create a new concert to be shared with others
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-primary-600 hover:bg-primary-400 text-white flex items-center gap-2"
          >
            <Music size={20} />
            View Concerts
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-primary-300 text-primary-300 hover:bg-primary-100 hover:text-white flex items-center gap-2"
          >
            <Calendar size={20} />
            Create Concerts
          </Button>
        </div>
      </div>
    </section>
  );
}