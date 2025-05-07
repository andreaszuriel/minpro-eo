'use client';

import { useState } from 'react';
import { Calendar, Send, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setEmail('');
      
      // Reset the success message after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  return (
    <footer className="bg-gradient-to-r from-primary-700 to-primary-800 text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Upper Section */}
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* Logo Section */}
          <div className="max-w-xs">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 mr-2 text-white" />
              <span className="text-2xl font-bold font-brand tracking-tight">
                live<span className="text-secondary-400">wave</span>
              </span>
            </div>
            <p className="text-primary-100/80 text-sm mb-6">
              Discover the best live music events in your area. Never miss your favorite artist's concert again.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
            <div>
              <h3 className="font-medium text-secondary-300 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/explore" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Explore Events
                  </a>
                </li>
                <li>
                  <a href="/artists" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Artists
                  </a>
                </li>
                <li>
                  <a href="/venues" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Venues
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-secondary-300 mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/about" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-secondary-300 mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/terms" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-primary-100 hover:text-secondary-300 transition-colors duration-200">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-primary-600/60 my-8"></div>
        
        {/* Newsletter and Social Section */}
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Newsletter */}
          <div className="max-w-md">
            <h3 className="font-medium text-lg text-secondary-300 mb-3">Subscribe to Our Newsletter</h3>
            <p className="text-primary-100/80 text-sm mb-4">
              Get the latest updates about concerts, exclusive presales, and special offers delivered to your inbox.
            </p>
            
            {submitted ? (
              <div className="bg-secondary-500/20 border border-secondary-500/30 text-secondary-300 px-4 py-3 rounded-lg flex items-center">
                <span className="text-sm font-medium">Thank you for subscribing!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-primary-600/50 border border-primary-500/50 rounded-lg py-2.5 pl-4 pr-10 text-sm text-white placeholder:text-primary-300/50 focus:outline-none focus:ring-2 focus:ring-secondary-400/50 focus:border-transparent"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-300/70" />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center rounded-lg bg-secondary-500 hover:bg-secondary-600 py-2.5 px-4 text-sm font-medium text-white transition-colors duration-200 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Social Media */}
          <div className="text-right">
            <h3 className="font-medium text-lg text-secondary-300 mb-3">Visit Our Social</h3>
            <div className="flex gap-4 justify-end mb-8">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600/60 hover:bg-tertiary-500/80 transition-colors duration-200 cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600/60 hover:bg-tertiary-500/80 transition-colors duration-200 cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-600/60 hover:bg-tertiary-500/80 transition-colors duration-200 cursor-pointer"
                aria-label="Discord"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M6.552 6.712c-2.59 0.944-4.097 3.328-4.097 3.328s1.74 1.92 4.224 2.766c0 0 0.32-0.569 0.319-0.567 0.496-0.902 1.029-1.747 1.596-2.538 0 0-0.794-0.429-2.042-2.989zM17.448 6.712c2.59 0.944 4.097 3.328 4.097 3.328s-1.74 1.92-4.224 2.766c0 0-0.32-0.569-0.319-0.567-0.496-0.902-1.029-1.747-1.596-2.538 0 0 0.794-0.429 2.042-2.989z"></path>
                  <path d="M10.075 18.859s0.7-0.825 1.925-0.825 1.925 0.825 1.925 0.825"></path>
                  <path d="M12 12.5v5"></path>
                  <path d="M15 12.5c0 1.38-1.343 2.5-3 2.5s-3-1.12-3-2.5 1.343-2.5 3-2.5 3 1.12 3 2.5z"></path>
                  <path d="M9 12.5c0-2-3-2-3-5 0-1.796 1.567-3.256 3.5-3.256"></path>
                  <path d="M15 12.5c0-2 3-2 3-5 0-1.796-1.567-3.256-3.5-3.256"></path>
                </svg>
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-primary-200/70">
              © 2025 Livewave - Your Premier Concert Management site
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}