import { Music, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
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
            href="/concerts" 
            className="flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-400"
          >
            <Music size={20} aria-hidden="true" />
            <span>View Concerts</span>
          </Link>

          <Link 
            href="/concerts/create" 
            className="flex items-center gap-2 rounded-md border border-primary-300 px-6 py-3 text-primary-300 transition-colors hover:bg-primary-100 hover:text-white"
          >
            <Calendar size={20} aria-hidden="true" />
            <span>Create Concerts</span>
          </Link>
        </div>
      </div>
    </section>
  );
}