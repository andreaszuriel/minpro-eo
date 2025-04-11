import React from "react";
import { Music, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 dark:bg-gray-900 px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
        One-stop platform for concerts
        <br />
        <span className="text-primary-600">attenders</span> and{" "}
        <span className="text-primary-600">organizers</span>
      </h1>

      <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 text-center mb-10">
        Share your passion by joining a concert or
        <br />
        create a new concert to be shared with others
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
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
  );
}

