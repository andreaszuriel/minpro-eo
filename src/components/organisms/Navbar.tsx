'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

// --- Interfaces ---
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
    filterError: string | null; // Pass error down
}

interface UserMenuProps {
    session: any;
    status: string;
    isScrolled: boolean;
    setShowUserMenu?: (show: boolean) => void;
    closeMobileMenu?: () => void;
    handleNavigation: (href: string) => void; // Pass navigation handler
}

// --- Standalone SearchBar Component ---
interface SearchBarProps {
  isScrolled: boolean;
  // Pass the actual setSearchQuery from context
  setSearchQuery: (query: string) => void;
  initialSearchQuery: string; 
  selectedCountryCode: string;
  selectedGenreName: string;
  clearFilters: () => void;
}

const SearchBar = ({
  isScrolled,
  setSearchQuery, // Function to update the context
  initialSearchQuery, // Initial value from context
  selectedCountryCode,
  selectedGenreName,
  clearFilters
}: SearchBarProps) => {
  // Local state for the input value
  const [localQuery, setLocalQuery] = useState(initialSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  // Effect to sync local state IF the initial/context query changes externally (e.g., clearFilters)
  useEffect(() => {
      // Only update local state if it differs from the context state
      // This prevents resetting the input while the user is typing
      if (initialSearchQuery !== localQuery) {
           setLocalQuery(initialSearchQuery);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  // Function to handle the actual search submission
  const handleSearchSubmit = (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault(); // Prevent default form submission if any
      // Trim whitespace and update the context
      const queryToSubmit = localQuery.trim();
      setSearchQuery(queryToSubmit);
      // Blur the input after search
      inputRef.current?.blur();
  };

  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleSearchSubmit(event);
      }
  };

  // Handle clearing filters AND local input
  const handleClear = () => {
      setLocalQuery(''); // Clear local input immediately
      clearFilters(); // Clear context state (which will trigger useEffect)
  };

  return (
      <form 
          onSubmit={handleSearchSubmit}
          className="relative md:w-64 lg:w-80"
          role="search" 
      >
          {/* Make the icon clickable */}
          <button
              type="submit" 
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-offset-1 ${
                  isScrolled
                      ? 'text-gray-500 hover:text-primary-600 focus:ring-primary-300 focus:ring-offset-white'
                      : 'text-white/80 hover:text-white focus:ring-secondary-300 focus:ring-offset-primary-600'
              } transition-colors cursor-pointer`}
              aria-label="Submit search"
          >
              <Search className="h-4 w-4" />
          </button>

          <input
              ref={inputRef} // Attach ref
              type="text"
              placeholder="Search Events... (Press Enter)" 
              className={`w-full pl-10 pr-8 py-2 rounded-full border text-sm focus:outline-none ${
                  isScrolled
                      ? 'bg-slate-50 border-slate-200 text-gray-800 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400'
                      : 'bg-primary-400/30 border-primary-400 text-white placeholder:text-white/80 focus:ring-1 focus:ring-secondary-300 focus:border-secondary-300'
              }`}
              value={localQuery} // Controlled by local state
              onChange={(e) => setLocalQuery(e.target.value)} // Update local state only
              onKeyDown={handleKeyDown} // Handle Enter key
              aria-label="Search events input"
          />
          {/* Show clear button if local input OR any filter is active */}
          {(localQuery || selectedCountryCode || selectedGenreName) && (
              <button
                  type="button" // type="button" to prevent form submission
                  onClick={handleClear} // Use the updated clear handler
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-offset-1" // Added focus styles
                  aria-label="Clear search and filters"
              >
                   <X className={`h-4 w-4 transition-colors ${
                      isScrolled
                          ? 'text-gray-500 hover:text-gray-800 focus:ring-primary-300 focus:ring-offset-white'
                          : 'text-white/80 hover:text-white focus:ring-secondary-300 focus:ring-offset-primary-600'
                   }`} />
              </button>
          )}
      </form>
  );
};

// --- Standalone FilterDropdown Component --- 
const FilterDropdown = ({
    uniqueCountries,
    uniqueGenres,
    selectedCountryCode,
    selectedGenreName,
    setSelectedCountryCode,
    setSelectedGenreName,
    isLoading,
    filterError, // Receive error prop
}: FilterDropdownProps) => (
    <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100 w-64">
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
                    <p className="font-medium text-primary-700 mb-1 text-sm">Browse by Location</p>
                    {uniqueCountries.length === 0 ? (
                        <p className="text-xs text-gray-500 italic px-2 py-1">No countries available.</p>
                    ) : (
                        <div className="mt-1 max-h-36 overflow-y-auto custom-scrollbar">
                            {uniqueCountries.map(country => (
                                <button
                                    key={country.id}
                                    onClick={() => setSelectedCountryCode(country.code === selectedCountryCode ? '' : country.code)}
                                    className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                                        selectedCountryCode === country.code ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                                    }`}
                                >
                                    <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                                    <span className="truncate">{country.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Genres */}
                <div className="px-4 py-2">
                    <p className="font-medium text-primary-700 mb-1 text-sm">Browse by Genre</p>
                    {uniqueGenres.length === 0 ? (
                        <p className="text-xs text-gray-500 italic px-2 py-1">No genres available.</p>
                    ) : (
                        <div className="mt-1 max-h-36 overflow-y-auto custom-scrollbar">
                            {uniqueGenres.map(genre => (
                                <button
                                    key={genre.id}
                                    onClick={() => setSelectedGenreName(genre.name === selectedGenreName ? '' : genre.name)}
                                    className={`flex items-center w-full text-left py-1 px-2 text-sm rounded hover:bg-slate-100 ${
                                        selectedGenreName === genre.name ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                                    }`}
                                >
                                    <Music className="h-3 w-3 mr-2 flex-shrink-0" />
                                    <span className="truncate">{genre.name}</span>
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

// --- Standalone UserMenu Component --- 
const UserMenu = ({ session, status, handleNavigation, setShowUserMenu, closeMobileMenu }: UserMenuProps) => (
    <div className="py-2">
        {status === 'authenticated' ? (
            <>
                <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-primary-700 truncate">{session.user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <button
                    onClick={() => handleNavigation(`/dashboard/${session.user?.id}`)} // Use passed handler
                    className="cursor-pointer flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                >
                    <User className="h-4 w-4 mr-2 flex-shrink-0" /> 
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
                    <LogOut className="h-4 w-4 mr-2 flex-shrink-0" /> 
                    Sign Out
                </button>
            </>
        ) : (
            <>
                <button
                    onClick={() => handleNavigation('/login')} // Use passed handler
                    className="cursor-pointer flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                >
                    <span className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2 flex-shrink-0" /> 
                        Log In
                    </span>
                    <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                </button>
                <button
                    onClick={() => handleNavigation('/register')} // Use passed handler
                    className="cursor-pointer flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
                >
                    <span className="flex items-center">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" /> 
                        Create Account
                    </span>
                    <ArrowUpRight className="h-3 w-3 flex-shrink-0" /> 
                </button>
            </>
        )}
    </div>
);

// --- Main Navbar Component ---
export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [uniqueCountries, setUniqueCountries] = useState<FetchedCountry[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<FetchedGenre[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [filterError, setFilterError] = useState<string | null>(null);

  const { data: session, status } = useSession();

  const {
      searchQuery, // Get the current context query
      selectedCountry: selectedCountryCode,
      selectedGenre: selectedGenreName,
      setSearchQuery, // Get the setter function from context
      setSelectedCountry: setSelectedCountryCodeDirect,
      setSelectedGenre: setSelectedGenreNameDirect,
      clearFilters, // Get the clear function
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

            if (!countriesRes.ok) throw new Error(`Failed to fetch countries: ${countriesRes.statusText}`);
            if (!genresRes.ok) throw new Error(`Failed to fetch genres: ${genresRes.statusText}`);

            const countriesData: FetchedCountry[] = await countriesRes.json();
            const genresData: FetchedGenre[] = await genresRes.json();

            if (!Array.isArray(countriesData)) throw new Error("Invalid countries data format");
            if (!Array.isArray(genresData)) throw new Error("Invalid genres data format");

            setUniqueCountries(countriesData);
            setUniqueGenres(genresData);
        } catch (error) {
            console.error("Error fetching filter data:", error);
            setFilterError(error instanceof Error ? error.message : "Failed to load filters");
            setUniqueCountries([]);
            setUniqueGenres([]);
        } finally {
            setIsLoadingFilters(false);
        }
        };
        fetchFilterData();
    }, []);

    // Track scroll
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        // Set initial state
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

     // Debounced search handler - stable reference via useCallback
    const handleSearch = useCallback(
        debounce((query: string) => {
            setSearchQuery(query);
        }, 300),
        [setSearchQuery] // Dependency is stable from useFilters
    );

    // Stable handlers for setting filters (close dropdown after selection)
    const setSelectedCountryCode = useCallback((code: string) => {
        setSelectedCountryCodeDirect(code);
        setShowFilterDropdown(false); // Close dropdown on selection
    }, [setSelectedCountryCodeDirect]);

    const setSelectedGenreName = useCallback((name: string) => {
        setSelectedGenreNameDirect(name);
        setShowFilterDropdown(false); // Close dropdown on selection
    }, [setSelectedGenreNameDirect]);


    // Handle click outside for ALL menus/dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Close mobile menu
            if (isMobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
                setIsMobileMenuOpen(false);
            }
            // Close user menu
            if (showUserMenu && !target.closest('#user-menu') && !target.closest('#user-button')) {
                setShowUserMenu(false);
            }
            // Close filter dropdown
            if (showFilterDropdown && !target.closest('#filter-dropdown-container') && !target.closest('#filter-button')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen, showUserMenu, showFilterDropdown]); // Add showFilterDropdown dependency


    // Navigation handler 
    const handleNavigation = useCallback((href: string) => {
        router.push(href);
        // Close all menus/dropdowns on navigation
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
        setShowFilterDropdown(false);
    }, [router]);


    // Shared nav links component 
    const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={mobile ? 'grid grid-cols-2 gap-4' : 'flex items-center space-x-6'}>
            {[
                { href: '/concerts', label: 'Concerts', icon: Ticket },
                { href: '/venues', label: 'Venues', icon: MapPin },
                { href: '/artists', label: 'Artists', icon: Music },
                // Conditionally add profile link ONLY if authenticated and on mobile
                ...(status === 'authenticated' && mobile && session?.user?.id
                    ? [{ href: `/dashboard/${session.user.id}`, label: 'My Profile', icon: User }]
                    : []),
            ].map(({ href, label, icon: Icon }) => (
                <button
                    key={href}
                    onClick={() => handleNavigation(href)}
                    className={mobile
                        ? `flex items-center p-3 rounded-lg transition-colors duration-200 ${isScrolled ? 'bg-slate-50 text-primary-700 hover:bg-slate-100' : 'bg-primary-400/80 text-white hover:bg-primary-400'}`
                        : `font-medium hover:text-tertiary-500 transition-colors relative group text-left`
                    }
                >
                    {mobile && <Icon className="h-5 w-5 mr-2 flex-shrink-0" />}
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
                        className="cursor-pointer flex items-center flex-shrink-0" 
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
                        <div id="filter-dropdown-container" className="relative"> {/* Added ID for outside click */}
                             <button
                                id="filter-button" // Added ID for outside click
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)} // Toggle state
                                className={`flex items-center font-medium transition-colors ${isScrolled ? 'hover:text-tertiary-500' : 'hover:text-secondary-400'} ${(selectedCountryCode || selectedGenreName) ? (isScrolled ? 'text-tertiary-500' : 'text-secondary-400 font-semibold') : ''}`} // Highlight if active
                            >
                                Browse
                                <Filter className="h-4 w-4 ml-1" />
                                {/* Add indicator if filters active */}
                                {(selectedCountryCode || selectedGenreName) && <span className={`ml-1.5 h-1.5 w-1.5 rounded-full ${isScrolled ? 'bg-tertiary-500' : 'bg-secondary-400'}`}></span>}
                            </button>
                            {/* --- Updated Dropdown Content --- */}
                             <AnimatePresence>
                                {showFilterDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 top-full mt-2 z-10" // Ensure dropdown is above other content if needed
                                    >
                                        <FilterDropdown
                                            uniqueCountries={uniqueCountries}
                                            uniqueGenres={uniqueGenres}
                                            selectedCountryCode={selectedCountryCode}
                                            selectedGenreName={selectedGenreName}
                                            // Pass down the stable setters
                                            setSelectedCountryCode={setSelectedCountryCode}
                                            setSelectedGenreName={setSelectedGenreName}
                                            isLoading={isLoadingFilters}
                                            filterError={filterError} // Pass error down
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Search and User */}
                    <div className="flex items-center gap-4">
                       {/* Use the standalone SearchBar component */}
                       <SearchBar
                            isScrolled={isScrolled}
                            setSearchQuery={setSearchQuery} // Pass the context setter
                            initialSearchQuery={searchQuery} // Pass current context value for initialization/sync
                            selectedCountryCode={selectedCountryCode}
                            selectedGenreName={selectedGenreName}
                            clearFilters={clearFilters} // Pass clear function
                        />
                        <div className="relative">
                            <button
                                id="user-button"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={`flex items-center justify-center p-2 rounded-full transition-colors duration-200 ${
                                    isScrolled ? 'hover:bg-slate-100' : 'hover:bg-primary-500/80' // Adjusted hover
                                }`}
                                aria-label="User menu"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className={`h-5 w-5 animate-spin ${isScrolled ? 'text-gray-400' : 'text-white/80'}`} />
                                ) : status === 'authenticated' ? (
                                    <div className="cursor-pointer h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold text-sm"> {/* Made size consistent */}
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
                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-10" // Ensure dropdown is above other content
                                    >
                                        {/* Use standalone UserMenu, pass handleNavigation */}
                                        <UserMenu
                                            session={session}
                                            status={status}
                                            isScrolled={isScrolled} 
                                            setShowUserMenu={setShowUserMenu}
                                            handleNavigation={handleNavigation} // Pass nav handler
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Mobile Menu --- */}
            {/* Header */}
             <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:hidden">
                <div className="flex h-16 items-center justify-between">
                     {/* Logo */}
                     <button
                        onClick={() => handleNavigation('/')}
                        className="cursor-pointer flex items-center flex-shrink-0 mr-4" 
                    >
                        <Calendar className={`h-5 w-5 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
                        <span className="text-2xl font-bold font-brand tracking-tight">
                        live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
                        </span>
                    </button>
                    {/* Menu Button */}
                    <button
                        id="menu-button"
                        className={`p-2 rounded-md transition-colors duration-200 ${isScrolled ? 'hover:bg-slate-100' : 'hover:bg-primary-500/80'}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
             </div>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        id="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }} 
                        className={`md:hidden overflow-hidden ${isScrolled ? 'bg-white' : 'bg-primary-600'}`} 
                        style={{ maxHeight: 'calc(100vh - 4rem)' }} 
                    >
                        <div className="px-4 pt-4 pb-6 space-y-4 overflow-y-auto custom-scrollbar"> 
                            {/* Search Bar for Mobile */}
                            <SearchBar
                                isScrolled={isScrolled}
                                setSearchQuery={setSearchQuery}
                                initialSearchQuery={searchQuery}
                                selectedCountryCode={selectedCountryCode}
                                selectedGenreName={selectedGenreName}
                                clearFilters={clearFilters}
                            />

                             {/* Navigation Links */}
                            <NavLinks mobile />

                            {/* --- Mobile Filters --- */}
                            <div className="space-y-3 pt-2 border-t border-primary-400/30">
                                <h3 className={`text-sm font-semibold ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filters</h3>
                                {isLoadingFilters ? (
                                    <div className={`flex items-center text-sm ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading filters...
                                    </div>
                                ) : filterError ? (
                                    <div className={`text-sm ${isScrolled ? 'text-red-600' : 'text-red-300'}`}>{filterError}</div>
                                ) : (
                                    <>
                                        <div>
                                            <label htmlFor="mobile-country-filter" className={`block text-xs font-medium mb-1 ${isScrolled ? 'text-gray-600' : 'text-primary-200'}`}>Country</label>
                                            <select
                                                id="mobile-country-filter"
                                                value={selectedCountryCode}
                                                // Use the direct setter from context
                                                onChange={(e) => setSelectedCountryCodeDirect(e.target.value)}
                                                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 ${
                                                    isScrolled
                                                        ? 'bg-slate-50 border-slate-300 text-gray-800 focus:ring-primary-300 focus:border-primary-300'
                                                        : 'bg-primary-500/50 border-primary-400/50 text-white focus:ring-secondary-300 focus:border-secondary-300'
                                                }`}
                                            >
                                                <option value="">All Countries</option>
                                                {uniqueCountries.map(country => (
                                                    <option key={country.id} value={country.code}>{country.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="mobile-genre-filter" className={`block text-xs font-medium mb-1 ${isScrolled ? 'text-gray-600' : 'text-primary-200'}`}>Genre</label>
                                            <select
                                                id="mobile-genre-filter"
                                                value={selectedGenreName}
                                                 // Use the direct setter from context
                                                onChange={(e) => setSelectedGenreNameDirect(e.target.value)}
                                                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 ${
                                                    isScrolled
                                                        ? 'bg-slate-50 border-slate-300 text-gray-800 focus:ring-primary-300 focus:border-primary-300'
                                                        : 'bg-primary-500/50 border-primary-400/50 text-white focus:ring-secondary-300 focus:border-secondary-300'
                                                }`}
                                            >
                                                <option value="">All Genres</option>
                                                {uniqueGenres.map(genre => (
                                                    <option key={genre.id} value={genre.name}>{genre.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {/* Clear Filters Button (Mobile) */}
                                {(searchQuery || selectedCountryCode || selectedGenreName) && !isLoadingFilters && (
                                    <button
                                        onClick={() => {
                                            clearFilters();
                                            // TODO: close menu: setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full mt-2 py-2 rounded-lg flex items-center justify-center text-sm font-medium ${
                                            isScrolled
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                            : 'bg-primary-500 hover:bg-primary-400 text-white'
                                        }`}
                                    >
                                        <X className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                        Clear Search & Filters
                                    </button>
                                )}
                            </div>

                             {/* User Section (Mobile) */}
                            <div className="pt-4 border-t border-primary-400/30">
                               {status === 'loading' ? (
                                    <div className="flex items-center justify-center p-4">
                                         <Loader2 className={`h-6 w-6 animate-spin ${isScrolled ? 'text-gray-400' : 'text-white/80'}`} />
                                    </div>
                                ) : status === 'authenticated' ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg"> {/* Made size consistent */}
                                            {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className={`font-medium truncate ${isScrolled ? 'text-primary-700' : 'text-white'}`}>{session.user?.name || 'User'}</p>
                                            <p className={`text-sm truncate ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>{session.user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                signOut({ callbackUrl: '/' });
                                                setIsMobileMenuOpen(false); // Close menu on sign out
                                            }}
                                            className={`ml-auto p-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
                                                isScrolled ? 'bg-slate-100 text-primary-700 hover:bg-slate-200' : 'bg-primary-500/80 text-white hover:bg-primary-500'
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
                                            className={`flex-1 py-2 px-3 text-center rounded-lg font-medium text-sm transition-colors duration-200 ${
                                                isScrolled ? 'bg-slate-100 text-primary-700 hover:bg-slate-200' : 'bg-primary-500/80 text-white hover:bg-primary-500'
                                            }`}
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => handleNavigation('/register')}
                                            className="flex-1 py-2 px-3 text-center rounded-lg font-medium text-sm bg-secondary-500 hover:bg-secondary-600 text-white transition-colors duration-200" // Adjusted secondary color
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

            {/* Global Scrollbar Style */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } /* Make track transparent */
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; } /* slate-400 */
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; } /* slate-500 */
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #94a3b8 transparent; }
             `}</style>
        </nav>
    );
}