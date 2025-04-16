import { MapPin, Music, Ticket, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  selectedCountry: string;
  selectedGenre: string;
  clearFilters: () => void;
  uniqueCountries: string[];
  uniqueGenres: string[];
  setSelectedCountry: (country: string) => void;
  setSelectedGenre: (genre: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

export default function MobileMenu({
  isScrolled,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  searchQuery,
  selectedCountry,
  selectedGenre,
  clearFilters,
  uniqueCountries,
  uniqueGenres,
  setSelectedCountry,
  setSelectedGenre,
  isLoggedIn,
  setIsLoggedIn,
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden overflow-hidden ${
            isScrolled ? 'bg-white' : 'bg-primary-500'
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link 
                href="/concerts" 
                className={`flex items-center p-3 rounded-lg ${
                  isScrolled 
                    ? 'bg-slate-50 text-primary-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <Ticket className="h-5 w-5 mr-2" />
                <span className="font-medium">Concerts</span>
              </Link>
              <Link 
                href="/venues" 
                className={`flex items-center p-3 rounded-lg ${
                  isScrolled 
                    ? 'bg-slate-50 text-primary-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <MapPin className="h-5 w-5 mr-2" />
                <span className="font-medium">Venues</span>
              </Link>
              <Link 
                href="/artists" 
                className={`flex items-center p-3 rounded-lg ${
                  isScrolled 
                    ? 'bg-slate-50 text-primary-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <Music className="h-5 w-5 mr-2" />
                <span className="font-medium">Artists</span>
              </Link>
              {isLoggedIn && (
                <Link 
                  href="/tickets" 
                  className={`flex items-center p-3 rounded-lg ${
                    isScrolled 
                      ? 'bg-slate-50 text-primary-700'
                      : 'bg-primary-400 text-white'
                  }`}
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  <span className="font-medium">My Tickets</span>
                </Link>
              )}
            </div>

            {/* Mobile Filters */}
            <div className="space-y-3">
              <p className={`font-medium ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filter by Country</p>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 ${
                  isScrolled 
                    ? 'bg-slate-50 border border-slate-200 text-gray-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              
              <p className={`font-medium ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filter by Genre</p>
              <select 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 ${
                  isScrolled 
                    ? 'bg-slate-50 border border-slate-200 text-gray-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <option value="">All Genres</option>
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Mobile Auth */}
            <div className="pt-4 border-t border-primary-400">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold">
                    U
                  </div>
                  <div>
                    <p className={`font-medium ${isScrolled ? 'text-primary-700' : 'text-white'}`}>User Name</p>
                    <p className={`text-sm ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>user@example.com</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsLoggedIn(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`ml-auto p-2 rounded-full ${
                      isScrolled 
                        ? 'bg-slate-50 text-primary-700'
                        : 'bg-primary-400 text-white'
                    }`}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link 
                    href="/login"
                    className={`flex-1 py-2 text-center rounded-lg font-medium ${
                      isScrolled 
                        ? 'bg-slate-50 text-primary-700'
                        : 'bg-primary-400 text-white'
                    }`}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/register"
                    className="flex-1 py-2 text-center rounded-lg font-medium bg-secondary-600 text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedCountry || selectedGenre) && (
              <button 
                onClick={() => {
                  clearFilters();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full py-2 rounded-lg flex items-center justify-center font-medium ${
                  isScrolled 
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-primary-400 text-white'
                }`}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}