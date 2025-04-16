import { Search, User, LogIn, UserPlus, MapPin, Music, Filter, ArrowUpRight, Ticket, LogOut, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DesktopMenuProps {
  isScrolled: boolean;
  searchQuery: string;
  selectedCountry: string;
  selectedGenre: string;
  handleSearch: (query: string) => void;
  clearFilters: () => void;
  uniqueCountries: string[];
  uniqueGenres: string[];
  setSelectedCountry: (country: string) => void;
  setSelectedGenre: (genre: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
}

export default function DesktopMenu({
  isScrolled,
  searchQuery,
  selectedCountry,
  selectedGenre,
  handleSearch,
  clearFilters,
  uniqueCountries,
  uniqueGenres,
  setSelectedCountry,
  setSelectedGenre,
  isLoggedIn,
  setIsLoggedIn,
  showUserMenu,
  setShowUserMenu,
}: DesktopMenuProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <Calendar 
              className={`h-4 w-4 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} 
            />
            <span className="text-2xl font-bold font-brand tracking-tight">
              live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
            </span>
          </Link>
        </div>

        {/* Middle Section - Main Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link 
            href="/concerts" 
            className="font-medium hover:text-tertiary-500 transition-colors relative group"
          >
            Concerts
            <span className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? 'bg-tertiary-500' : 'bg-secondary-400'} transition-all duration-300 group-hover:w-full`}></span>
          </Link>
          <Link 
            href="/venues" 
            className="font-medium hover:text-tertiary-500 transition-colors relative group"
          >
            Venues
            <span className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? 'bg-tertiary-500' : 'bg-secondary-400'} transition-all duration-300 group-hover:w-full`}></span>
          </Link>
          <Link 
            href="/artists" 
            className="font-medium hover:text-tertiary-500 transition-colors relative group"
          >
            Artists
            <span className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? 'bg-tertiary-500' : 'bg-secondary-400'} transition-all duration-300 group-hover:w-full`}></span>
          </Link>
          <div className="relative group">
            <button 
              className="flex items-center font-medium hover:text-tertiary-500 transition-colors"
            >
              Browse 
              <Filter className="h-4 w-4 ml-1" />
            </button>
            
            {/* Dropdown Content */}
            <div className="absolute left-0 top-full mt-2 w-56 hidden group-hover:block">
              <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-medium text-primary-700">Browse by Location</p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uniqueCountries.map(country => (
                      <button
                        key={country}
                        onClick={() => setSelectedCountry(country)}
                        className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                          selectedCountry === country ? 'text-tertiary-500 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <MapPin className="h-3 w-3 mr-2" />
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="px-4 py-2">
                  <p className="font-medium text-primary-700">Browse by Genre</p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uniqueGenres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                          selectedGenre === genre ? 'text-tertiary-500 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Music className="h-3 w-3 mr-2" />
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Search, Auth, etc */}
        <div className="flex items-center gap-4">
          {/* Search Box */}
          <div className="relative md:w-64 lg:w-80">
            <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              isScrolled ? 'text-gray-500' : 'text-white'
            }`} />
            <input
              type="text"
              placeholder="Search events..."
              className={`w-full pl-10 pr-8 py-2 rounded-full border text-sm focus:outline-none ${
                isScrolled 
                  ? 'bg-slate-50 border-slate-200 text-gray-800 focus:border-primary-300 focus:ring-1 focus:ring-primary-300' 
                  : 'bg-primary-400/30 border-primary-400 text-white placeholder:text-white/80 focus:ring-1 focus:ring-secondary-300'
              }`}
              value={searchQuery}
              onChange={(e) => {
                handleSearch(e.target.value);
              }}
            />
            {(searchQuery || selectedCountry || selectedGenre) && (
              <button 
                onClick={clearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className={`h-4 w-4 ${isScrolled ? 'text-gray-500' : 'text-white'}`} />
              </button>
            )}
          </div>

          {/* User Menu (Desktop) */}
          <div className="hidden md:block relative">
            <button
              id="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center justify-center p-2 rounded-full ${
                isScrolled 
                  ? 'hover:bg-slate-100' 
                  : 'hover:bg-primary-500'
              }`}
            >
              {isLoggedIn ? (
                <div className="h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold">
                  U
                </div>
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  id="user-menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100"
                >
                  {isLoggedIn ? (
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-medium text-primary-700">User Name</p>
                        <p className="text-sm text-gray-500">user@example.com</p>
                      </div>
                      <Link 
                        href="/profile" 
                        className="flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                      <Link 
                        href="/tickets" 
                        className="flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        My Tickets
                      </Link>
                      <button 
                        onClick={() => {
                          setIsLoggedIn(false);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Link 
                        href="/login" 
                        className="flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                      >
                        <span className="flex items-center">
                          <LogIn className="h-4 w-4 mr-2" />
                          Log In
                        </span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <Link 
                        href="/register" 
                        className="flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
                      >
                        <span className="flex items-center">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
                        </span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}