'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, User, LogIn, MapPin, Music, Filter, ArrowUpRight,
  Ticket, LogOut, Calendar, X, Menu, Loader2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '../../utils/debounce'; 
import { useFilters } from '@/lib/FilterContext';
import { useSession, signOut } from 'next-auth/react';
import type { Country, Genre } from '@prisma/client'; 

// Interfaces for fetched data 
interface FetchedCountry extends Pick<Country, 'id' | 'name' | 'code'> {}
interface FetchedGenre extends Pick<Genre, 'id' | 'name'> {}

interface FilterDropdownProps {
  uniqueCountries: FetchedCountry[];
  uniqueGenres: FetchedGenre[];
  selectedCountryCode: string; 
  selectedGenreName: string;   
  setSelectedCountryCode: (code: string) => void; 
  setSelectedGenreName: (name: string) => void;   
  isLoading: boolean; 
}

interface UserMenuProps {
  session: any;
  status: string;
  isScrolled: boolean;
  setShowUserMenu?: (show: boolean) => void;
  closeMobileMenu?: () => void;
}

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // State to hold fetched countries and genres
  const [uniqueCountries, setUniqueCountries] = useState<FetchedCountry[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<FetchedGenre[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true); 
  const [filterError, setFilterError] = useState<string | null>(null); 

  const { data: session, status } = useSession();

  const {
    searchQuery,
    selectedCountry: selectedCountryCode, 
    selectedGenre: selectedGenreName,    
    setSearchQuery,
    setSelectedCountry: setSelectedCountryCode,
    setSelectedGenre: setSelectedGenreName,     
    clearFilters,
  } = useFilters();

  // Fetch countries and genres from API
  useEffect(() => {
    const fetchFilterData = async () => {
      setIsLoadingFilters(true);
      setFilterError(null);
      try {
        const [countriesRes, genresRes] = await Promise.all([
          fetch('/api/countries'),
          fetch('/api/genres')
        ]);

        if (!countriesRes.ok) {
          throw new Error(`Failed to fetch countries: ${countriesRes.statusText}`);
        }
        if (!genresRes.ok) {
          throw new Error(`Failed to fetch genres: ${genresRes.statusText}`);
        }

        const countriesData: FetchedCountry[] = await countriesRes.json();
        const genresData: FetchedGenre[] = await genresRes.json();

        // Basic validation 
        if (!Array.isArray(countriesData)) throw new Error("Invalid countries data format");
        if (!Array.isArray(genresData)) throw new Error("Invalid genres data format");


        setUniqueCountries(countriesData);
        setUniqueGenres(genresData);
      } catch (error) {
        console.error("Error fetching filter data:", error);
        setFilterError(error instanceof Error ? error.message : "Failed to load filters");
        setUniqueCountries([]); // Clear on error
        setUniqueGenres([]);    // Clear on error
      } finally {
        setIsLoadingFilters(false);
      }
    };

    fetchFilterData();
  }, []); // Fetch only once on mount

  // Track scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setIsMobileMenuOpen(false);
      }
      if (showUserMenu && !target.closest('#user-menu') && !target.closest('#user-button')) {
        setShowUserMenu(false);
      }
      // TODO: closing filter dropdown on outside click as well
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, showUserMenu]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    [setSearchQuery]
  );

  // Navigation handler using router
  const handleNavigation = (href: string) => {
    router.push(href);
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  // Shared nav links component 
  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'grid grid-cols-2 gap-4' : 'flex items-center space-x-6'}>
      {[
        { href: '/concerts', label: 'Concerts', icon: Ticket },
        { href: '/venues', label: 'Venues', icon: MapPin },
        { href: '/artists', label: 'Artists', icon: Music },
        ...(status === 'authenticated' && mobile && session?.user?.id
          ? [{ href: `/dashboard/${session.user.id}`, label: 'My Profile', icon: User }]
          : []),
      ].map(({ href, label, icon: Icon }) => (
        <button
          key={href}
          onClick={() => handleNavigation(href)}
          className={mobile
            ? `flex items-center p-3 rounded-lg ${isScrolled ? 'bg-slate-50 text-primary-700' : 'bg-primary-400 text-white'}`
            : `font-medium hover:text-tertiary-500 transition-colors relative group text-left`
          }
        >
          {mobile && <Icon className="h-5 w-5 mr-2" />}
          <span className={mobile ? 'font-medium' : ''}>{label}</span>
          {!mobile && (
            <span
              className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? 'bg-tertiary-500' : 'bg-secondary-400'} transition-all duration-300 group-hover:w-full`}
            />
          )}
        </button>
      ))}
    </div>
  );

  // --- Filter Dropdown ---
  const FilterDropdown = ({
    uniqueCountries,
    uniqueGenres,
    selectedCountryCode,
    selectedGenreName,
    setSelectedCountryCode,
    setSelectedGenreName,
    isLoading,
  }: FilterDropdownProps) => (
    <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100 w-64"> {/* Increased width slightly */}
      {isLoading ? (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading filters...
        </div>
      ) : filterError ? (
        <div className="p-4 text-red-600 text-sm">{filterError}</div>
      ) : (
        <>
          {/* Countries */}
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="font-medium text-primary-700 mb-1">Browse by Location</p>
            {uniqueCountries.length === 0 ? (
                 <p className="text-sm text-gray-500 italic">No countries available.</p>
            ) : (
                <div className="mt-1 max-h-36 overflow-y-auto custom-scrollbar"> 
                {uniqueCountries.map(country => (
                    <button
                    key={country.id} // Use ID for key
                    // Set country CODE in context
                    onClick={() => setSelectedCountryCode(country.code === selectedCountryCode ? '' : country.code)}
                    className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                        selectedCountryCode === country.code ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                    }`}
                    >
                    <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{country.name}</span> {/* Display country NAME */}
                    </button>
                ))}
                </div>
            )}
          </div>
          {/* Genres */}
          <div className="px-4 py-2">
            <p className="font-medium text-primary-700 mb-1">Browse by Genre</p>
              {uniqueGenres.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No genres available.</p>
              ) : (
                <div className="mt-1 max-h-36 overflow-y-auto custom-scrollbar"> 
                {uniqueGenres.map(genre => (
                    <button
                    key={genre.id} // Use ID for key
                    // Set genre NAME in context
                    onClick={() => setSelectedGenreName(genre.name === selectedGenreName ? '' : genre.name)}
                    className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                        selectedGenreName === genre.name ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                    }`}
                    >
                    <Music className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{genre.name}</span> {/* Display genre NAME */}
                    </button>
                ))}
                </div>
              )}
          </div>
           {/* Clear Button */}
           {(selectedCountryCode || selectedGenreName) && (
             <div className="px-4 pt-2 pb-1 border-t border-slate-100">
                <button
                    onClick={() => {
                        setSelectedCountryCode('');
                        setSelectedGenreName('');
                    }}
                    className="w-full text-xs text-center py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                    Clear Selection
                </button>
            </div>
           )}
        </>
      )}
    </div>
  );

  // Shared search bar component 
  const SearchBar = () => (
    <div className="relative md:w-64 lg:w-80">
      <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${isScrolled ? 'text-gray-500' : 'text-white'}`} />
      <input
        type="text"
        placeholder="Search events..."
        className={`w-full pl-10 pr-8 py-2 rounded-full border text-sm focus:outline-none ${
          isScrolled
            ? 'bg-slate-50 border-slate-200 text-gray-800 focus:border-primary-300 focus:ring-1 focus:ring-primary-300'
            : 'bg-primary-400/30 border-primary-400 text-white placeholder:text-white/80 focus:ring-1 focus:ring-secondary-300'
        }`}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {(searchQuery || selectedCountryCode || selectedGenreName) && (
        <button onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X className={`h-4 w-4 ${isScrolled ? 'text-gray-500' : 'text-white'}`} />
        </button>
      )}
    </div>
  );

  // Shared user menu component 
  const UserMenu = ({ session, status, isScrolled, setShowUserMenu, closeMobileMenu }: UserMenuProps) => (
    <div className="py-2">
      {status === 'authenticated' ? (
        <>
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="font-medium text-primary-700">{session.user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{session.user?.email}</p>
          </div>
          <button
            onClick={() => handleNavigation(`/dashboard/${session.user?.id}`)}
            className="cursor-pointer flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </button>

          <button
            onClick={() => {
              signOut({ callbackUrl: '/' });
              setShowUserMenu?.(false);
              closeMobileMenu?.();
            }}
            className="cursor-pointer flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleNavigation('/login')}
            className="cursor-pointer flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
          >
            <span className="flex items-center">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleNavigation('/register')}
            className="cursor-pointer flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
          >
            <span className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Create Account
            </span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white text-primary-700 shadow-lg'
          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
      }`}
    >
      {/* --- Desktop Menu --- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 hidden md:block">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavigation('/')}
            className="cursor-pointer flex items-center"
          >
            <Calendar className={`h-4 w-4 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
            <span className="text-2xl font-bold font-brand tracking-tight">
              live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
            </span>
          </button>

          {/* Navigation and Filters */}
          <div className="hidden lg:flex items-center space-x-6">
            <NavLinks />
            {/* --- Browse Dropdown Trigger --- */}
            <div className="relative group">
              <button className={`flex items-center font-medium transition-colors ${isScrolled ? 'hover:text-tertiary-500' : 'hover:text-secondary-400'}`}>
                Browse <Filter className="h-4 w-4 ml-1" />
              </button>
              {/* --- Updated Dropdown Content --- */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block group-focus-within:block"> {/* Added focus-within */}
                <FilterDropdown
                  uniqueCountries={uniqueCountries}
                  uniqueGenres={uniqueGenres}
                  selectedCountryCode={selectedCountryCode}
                  selectedGenreName={selectedGenreName}
                  setSelectedCountryCode={setSelectedCountryCode}
                  setSelectedGenreName={setSelectedGenreName}
                  isLoading={isLoadingFilters}
                />
              </div>
            </div>
          </div>

          {/* Search and User */}
          <div className="flex items-center gap-4">
            <SearchBar />
            <div className="relative">
              <button
                id="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center justify-center p-2 rounded-full ${
                  isScrolled ? 'hover:bg-slate-100' : 'hover:bg-primary-500'
                }`}
              >
                {status === 'authenticated' ? (
                  <div className="cursor-pointer h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    id="user-menu"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100"
                  >
                    <UserMenu
                      session={session}
                      status={status}
                      isScrolled={isScrolled}
                      setShowUserMenu={setShowUserMenu}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu Button --- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:hidden">
         {/* Add Logo to Mobile View Header */}
        <div className="flex h-16 items-center justify-between">
            <button
                onClick={() => handleNavigation('/')}
                className="cursor-pointer flex items-center"
            >
                <Calendar className={`h-5 w-5 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
                <span className="text-2xl font-bold font-brand tracking-tight">
                live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
                </span>
            </button>
            <button
                id="menu-button"
                className={`p-2 rounded-md ${isScrolled ? 'hover:bg-slate-100' : 'hover:bg-primary-500'}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden ${isScrolled ? 'bg-white' : 'bg-primary-500'}`}
            style={{ maxHeight: 'calc(100vh - 4rem)' }} // Limit height
          >
            <div className="px-4 pt-2 pb-6 space-y-4 overflow-y-auto"> {/* Make content scrollable */}
              {/* Search Bar for Mobile */}
              <div className="pt-2">
                 <SearchBar />
              </div>
              <NavLinks mobile />
              {/* --- Updated Mobile Filters --- */}
              <div className="space-y-3">
                {isLoadingFilters ? (
                  <div className={`flex items-center text-sm ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading filters...
                  </div>
                ) : filterError ? (
                  <div className={`text-sm ${isScrolled ? 'text-red-600' : 'text-red-300'}`}>{filterError}</div>
                ) : (
                  <>
                    <div>
                        <label htmlFor="mobile-country-filter" className={`block text-sm font-medium mb-1 ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filter by Country</label>
                        <select
                        id="mobile-country-filter"
                        value={selectedCountryCode} // Use CODE
                        // Set country CODE on change
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 ${
                            isScrolled
                            ? 'bg-slate-50 border-slate-300 text-gray-800 focus:ring-primary-300 focus:border-primary-300'
                            : 'bg-primary-400/50 border-primary-400 text-white focus:ring-secondary-300 focus:border-secondary-300'
                        }`}
                        >
                        <option value="">All Countries</option>
                        {uniqueCountries.map(country => (
                            // Value is CODE, display is NAME
                            <option key={country.id} value={country.code}>{country.name}</option>
                        ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mobile-genre-filter" className={`block text-sm font-medium mb-1 ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filter by Genre</label>
                        <select
                        id="mobile-genre-filter"
                        value={selectedGenreName} // Use NAME
                        // Set genre NAME on change
                        onChange={(e) => setSelectedGenreName(e.target.value)}
                        className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 ${
                            isScrolled
                            ? 'bg-slate-50 border-slate-300 text-gray-800 focus:ring-primary-300 focus:border-primary-300'
                            : 'bg-primary-400/50 border-primary-400 text-white focus:ring-secondary-300 focus:border-secondary-300'
                        }`}
                        >
                        <option value="">All Genres</option>
                        {uniqueGenres.map(genre => (
                            // Value is NAME, display is NAME
                            <option key={genre.id} value={genre.name}>{genre.name}</option>
                        ))}
                        </select>
                    </div>
                  </>
                )}
              </div>
              {/* Clear Filters Button */}
              {(searchQuery || selectedCountryCode || selectedGenreName) && !isLoadingFilters && (
                <button
                  onClick={() => {
                    clearFilters();
                    // Optionally close menu: setIsMobileMenuOpen(false);
                  }}
                  className={`w-full mt-2 py-2 rounded-lg flex items-center justify-center text-sm font-medium ${
                    isScrolled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-primary-400 hover:bg-primary-300 text-white'
                  }`}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear Search & Filters
                </button>
              )}
              {/* User Section */}
              <div className="pt-4 border-t border-primary-400/50">
                {status === 'authenticated' ? (
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-grow min-w-0"> {/* Allow text to wrap */}
                      <p className={`font-medium truncate ${isScrolled ? 'text-primary-700' : 'text-white'}`}>{session.user?.name || 'User'}</p>
                      <p className={`text-sm truncate ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setIsMobileMenuOpen(false);
                      }}
                      className={`ml-auto p-2 rounded-full flex-shrink-0 ${
                        isScrolled ? 'bg-slate-100 text-primary-700 hover:bg-slate-200' : 'bg-primary-400/80 text-white hover:bg-primary-400'
                      }`}
                      aria-label="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleNavigation('/login')}
                      className={`flex-1 py-2 text-center rounded-lg font-medium text-sm ${
                        isScrolled ? 'bg-slate-100 text-primary-700 hover:bg-slate-200' : 'bg-primary-400/80 text-white hover:bg-primary-400'
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => handleNavigation('/register')}
                      className="flex-1 py-2 text-center rounded-lg font-medium text-sm bg-secondary-600 hover:bg-secondary-700 text-white"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; /* slate-100 */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8; /* slate-400 */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b; /* slate-500 */
        }
      `}</style>
    </nav>
  );
}