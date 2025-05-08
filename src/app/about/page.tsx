'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  RadioTower,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Video,
  GripVertical,
  Ticket,
  Users,
  Clock,
  Send,
  MessageSquare
} from 'lucide-react';

export default function AboutPage() {
  const [messageSent, setMessageSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Simulating form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessageSent(true);
    if (formRef.current) {
      formRef.current.reset();
    }
    
    // Reset after 5 seconds
    setTimeout(() => {
      setMessageSent(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-24 text-center md:py-32">
        <div className="absolute left-0 top-0 h-full w-full opacity-40">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-black/60 to-black"></div>
          <Image
            src="/api/placeholder/1600/600"
            alt="Concert crowd"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl md:text-8xl">
              <span className="text-shadow-hard block text-tertiary-400">About</span>
              <span className="text-shadow-hard-primary -mt-2 block text-primary-500 sm:-mt-3 md:-mt-5">LiveWave</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              Amplifying Indonesia's underground scene since 2015 — where music, rebellion, and community collide.
            </p>
            <div className="mt-6 h-1 w-2/3 max-w-xs mx-auto bg-gradient-to-r from-tertiary-500 via-primary-500 to-purple-600"></div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="inline-block transform bg-tertiary-400 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl -skew-x-6">
              Our Story
            </h2>
          </motion.div>

          <div className="grid gap-16 lg:grid-cols-5 lg:gap-x-12">
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="mb-6 text-2xl font-bold uppercase text-primary-500 md:text-3xl">From DIY Shows to National Movement</h3>
                <div className="space-y-4 text-lg">
                  <p>
                    <span className="text-tertiary-400 font-bold">LiveWave</span> was born in a sweaty Jakarta basement in 2015, where three friends — Maya, Dito, and Reza — organized their first punk show with just a PA system, two local bands, and an audience of fifty dedicated fans.
                  </p>
                  <p>
                    What started as a rebellion against corporate-dominated music venues quickly evolved into Indonesia's most authentic concert platform. By 2018, we were hosting shows across Jakarta, Bandung, Yogyakarta, and Bali, giving a stage to hundreds of indie artists who would have otherwise gone unheard.
                  </p>
                  <p>
                    In 2020, when live music came to a standstill, we pivoted to livestreams and helped Indonesian underground artists reach international audiences. As the scene revived, LiveWave emerged stronger, now powered by cutting-edge technology while still fiercely protecting our DIY ethics.
                  </p>
                  <p>
                    Today, LiveWave manages over 500 events annually across the archipelago, but we've never forgotten our roots. Every show, whether it's in a 5,000-capacity venue or a local community center, carries the spirit of that first basement gig.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative aspect-[4/5] overflow-hidden rounded-none border-4 border-tertiary-400"
              >
                <Image
                  src="/api/placeholder/800/1000"
                  alt="LiveWave founders at early show"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-center">
                  <p className="font-bold text-tertiary-400">LiveWave's first show at Rossi Musik, Jakarta (2015)</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="bg-gray-800 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="inline-block transform bg-primary-500 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl skew-x-6">
              What We Stand For
            </h2>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {/* Value 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="overflow-hidden border-2 border-gray-700 bg-gray-900 p-6 transition-all duration-300 hover:border-tertiary-400"
            >
              <div className="mb-4 text-tertiary-400">
                <RadioTower size={48} />
              </div>
              <h3 className="mb-3 text-xl font-bold uppercase text-primary-500 md:text-2xl">Music For All</h3>
              <p className="text-gray-300">
                We believe great music shouldn't be locked behind VIP passes. LiveWave works to keep ticket prices fair and venues accessible to everyone. Music belongs to the community, not just those who can afford it.
              </p>
            </motion.div>

            {/* Value 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="overflow-hidden border-2 border-gray-700 bg-gray-900 p-6 transition-all duration-300 hover:border-tertiary-400"
            >
              <div className="mb-4 text-tertiary-400">
                <Users size={48} />
              </div>
              <h3 className="mb-3 text-xl font-bold uppercase text-primary-500 md:text-2xl">Artist First</h3>
              <p className="text-gray-300">
                We started as musicians ourselves, so we know the struggle. We guarantee transparent finances, fair pay, and respect for artists' creative control. When artists thrive, the whole scene benefits.
              </p>
            </motion.div>

            {/* Value 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="overflow-hidden border-2 border-gray-700 bg-gray-900 p-6 transition-all duration-300 hover:border-tertiary-400"
            >
              <div className="mb-4 text-tertiary-400">
                <Clock size={48} />
              </div>
              <h3 className="mb-3 text-xl font-bold uppercase text-primary-500 md:text-2xl">Building Legacy</h3>
              <p className="text-gray-300">
                LiveWave isn't just about one-off shows. We're documenting Indonesia's musical evolution, creating platforms for new talent, and building infrastructure that will strengthen our country's music scene for generations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="inline-block transform bg-tertiary-400 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl -skew-x-6">
              Get In Touch
            </h2>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Contact Information */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-none border-2 border-gray-700 bg-gray-800 p-6 md:p-8"
              >
                <h3 className="mb-6 text-2xl font-bold uppercase text-tertiary-400">Reach Out</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPin className="mr-4 h-6 w-6 flex-shrink-0 text-primary-500" />
                    <div>
                      <h4 className="font-bold text-white">Main Office</h4>
                      <p className="text-gray-300">
                        Jl. Kemang Raya No. 58<br />
                        Bangka, Mampang Prapatan<br />
                        Jakarta Selatan 12730<br />
                        Indonesia
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="mr-4 h-6 w-6 flex-shrink-0 text-primary-500" />
                    <div>
                      <h4 className="font-bold text-white">Phone</h4>
                      <p className="text-gray-300">+62 21 7179 2468</p>
                      <p className="text-gray-300">+62 812 9876 5432 (WhatsApp)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="mr-4 h-6 w-6 flex-shrink-0 text-primary-500" />
                    <div>
                      <h4 className="font-bold text-white">Email</h4>
                      <p className="text-gray-300">livewave@example.com</p>
                      <p className="text-gray-300">artists@livewave.example.com</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-3 font-bold text-white">Follow Us</h4>
                    <div className="flex space-x-4">
                      <a href="#" className="text-tertiary-400 transition-colors hover:text-primary-500">
                        <Instagram size={24} />
                      </a>
                      <a href="#" className="text-tertiary-400 transition-colors hover:text-primary-500">
                        <Twitter size={24} />
                      </a>
                      <a href="#" className="text-tertiary-400 transition-colors hover:text-primary-500">
                        <Facebook size={24} />
                      </a>
                      <a href="#" className="text-tertiary-400 transition-colors hover:text-primary-500">
                        <Youtube size={24} />
                      </a>
                      <a href="#" className="text-tertiary-400 transition-colors hover:text-primary-500">
                        <Video size={24} />
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className="absolute -bottom-3 -right-3">
                  <GripVertical className="h-12 w-12 text-primary-500/40" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 rounded-none border-2 border-gray-700 bg-gray-800 p-6 md:p-8"
              >
                <h3 className="mb-4 text-xl font-bold uppercase text-tertiary-400">Opening Hours</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-bold text-white">Monday - Friday:</span> 10:00 - 18:00</p>
                  <p><span className="font-bold text-white">Saturday:</span> 11:00 - 15:00</p>
                  <p><span className="font-bold text-white">Sunday:</span> Closed</p>
                </div>
              </motion.div>
            </div>
            
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-none border-2 border-gray-700 bg-gray-800 p-6 md:p-8"
              >
                <h3 className="mb-6 text-2xl font-bold uppercase text-primary-500">Send A Message</h3>
                
                {messageSent ? (
                  <div className="rounded-sm bg-tertiary-400 p-6 text-center text-black">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12" />
                    <h4 className="text-xl font-bold">Message Sent!</h4>
                    <p className="mt-2">We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-2 block font-bold text-gray-200">Name</label>
                        <input
                          type="text"
                          id="name"
                          required
                          className="w-full rounded-none border-2 border-gray-700 bg-gray-900 p-3 text-white focus:border-tertiary-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-2 block font-bold text-gray-200">Email</label>
                        <input
                          type="email"
                          id="email"
                          required
                          className="w-full rounded-none border-2 border-gray-700 bg-gray-900 p-3 text-white focus:border-tertiary-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="mb-2 block font-bold text-gray-200">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        required
                        className="w-full rounded-none border-2 border-gray-700 bg-gray-900 p-3 text-white focus:border-tertiary-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="mb-2 block font-bold text-gray-200">Message</label>
                      <textarea
                        id="message"
                        rows={5}
                        required
                        className="w-full rounded-none border-2 border-gray-700 bg-gray-900 p-3 text-white focus:border-tertiary-400 focus:outline-none"
                      ></textarea>
                    </div>
                    
                    <div>
                      <Button
                        type="submit"
                        className="flex w-full items-center justify-center bg-tertiary-400 px-6 py-3 text-lg font-bold uppercase text-black transition-transform hover:scale-105 hover:bg-tertiary-300"
                      >
                        <Send className="mr-2 h-5 w-5" /> Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-none border-4 border-gray-700">
            {/* Replace with an actual map component if available */}
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <div className="text-center">
                <MapPin className="mx-auto h-16 w-16 text-primary-500" />
                <p className="mt-2 text-lg font-bold text-tertiary-400">Interactive Map Placeholder</p>
                <p className="text-sm text-gray-400">LiveWave HQ: Jl. Kemang Raya No. 58, Jakarta Selatan</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call To Action */}
      <section className="bg-black py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-none border-4 border-primary-500 bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12">
            <div className="absolute -right-12 -top-12 opacity-10">
              <Ticket className="h-48 w-48 text-tertiary-400" />
            </div>
            
            <div className="relative z-10 text-center md:text-left">
              <div className="md:flex md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-2xl font-black uppercase text-tertiary-400 md:text-3xl lg:text-4xl">Ready to Join The Movement?</h2>
                  <p className="mt-2 text-lg text-gray-300">
                    Whether you're an artist, venue, or fan — let's make some noise together.
                  </p>
                </div>
                
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 md:flex-shrink-0">
                  <Link href="/events" passHref>
                    <Button className="bg-tertiary-400 px-8 py-3 text-lg font-bold uppercase text-black transition-transform hover:scale-105 hover:bg-tertiary-300">
                      Browse Events
                    </Button>
                  </Link>
                  <Link href="/auth/signin" passHref>
                    <Button className="border-2 border-primary-500 bg-transparent px-8 py-3 text-lg font-bold uppercase text-primary-500 transition-transform hover:scale-105 hover:bg-primary-500 hover:text-black">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Global Styles */}
      <style jsx global>{`
        .text-shadow-hard {
          text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000;
        }
        .text-shadow-hard-primary {
          text-shadow: 2px 2px 0px #4a044e, -2px -2px 0px #4a044e, 2px -2px 0px #4a044e, -2px 2px 0px #4a044e;
        }
      `}</style>
    </div>
  );
}