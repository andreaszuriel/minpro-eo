'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Search, User, LogIn, MapPin, Music, ArrowUpRight,
     LogOut, Calendar, X, Menu, Loader2, ChevronDown
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

// ---  Dropdown Components ---

// Country Filter Dropdown
interface CountryFilterDropdownProps {
    uniqueCountries: FetchedCountry[];
    selectedCountryCode: string;
    setSelectedCountryCode: (code: string) => void; // Expects the callback that closes dropdown
    isLoading: boolean;
    filterError: string | null;
}

const CountryFilterDropdown = ({
    uniqueCountries,
    selectedCountryCode,
    setSelectedCountryCode,
    isLoading,
    filterError,
}: CountryFilterDropdownProps) => (
    <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100 w-60"> 
        {isLoading ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading countries...
            </div>
        ) : filterError ? (
            <div className="p-4 text-red-600 text-sm">{filterError}</div>
        ) : (
            <>
                <p className="font-medium text-primary-700 mb-1 text-sm px-4 pt-2">Select Country</p>
                {uniqueCountries.length === 0 ? (
                    <p className="text-xs text-gray-500 italic px-4 py-1">No countries available.</p>
                ) : (
                    <div className="mt-1 max-h-48 overflow-y-auto custom-scrollbar px-2"> 
                        {uniqueCountries.map(country => (
                            <button
                                key={country.id}
                                onClick={() => setSelectedCountryCode(country.code === selectedCountryCode ? '' : country.code)}
                                className={`flex items-center w-full text-left py-1.5 px-2 text-sm rounded hover:bg-slate-100 ${
                                    selectedCountryCode === country.code ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                                }`}
                            >
                                <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span className="truncate">{country.name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {/* Clear Button */}
                {selectedCountryCode && (
                    <div className="px-4 pt-2 pb-1 border-t border-slate-100 mt-1">
                        <button
                            onClick={() => setSelectedCountryCode('')}
                            className="w-full text-xs text-center py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                            Clear Country
                        </button>
                    </div>
                )}
            </>
        )}
    </div>
);

// Genre Filter Dropdown
interface GenreFilterDropdownProps {
    uniqueGenres: FetchedGenre[];
    selectedGenreName: string;
    setSelectedGenreName: (name: string) => void; // Expects the callback that closes dropdown
    isLoading: boolean;
    filterError: string | null;
}

const GenreFilterDropdown = ({
    uniqueGenres,
    selectedGenreName,
    setSelectedGenreName,
    isLoading,
    filterError,
}: GenreFilterDropdownProps) => (
    <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100 w-60"> 
         {isLoading ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading genres...
            </div>
        ) : filterError ? (
            <div className="p-4 text-red-600 text-sm">{filterError}</div>
        ) : (
            <>
                <p className="font-medium text-primary-700 mb-1 text-sm px-4 pt-2">Select Genre</p>
                {uniqueGenres.length === 0 ? (
                    <p className="text-xs text-gray-500 italic px-4 py-1">No genres available.</p>
                ) : (
                    <div className="mt-1 max-h-48 overflow-y-auto custom-scrollbar px-2"> 
                        {uniqueGenres.map(genre => (
                            <button
                                key={genre.id}
                                onClick={() => setSelectedGenreName(genre.name === selectedGenreName ? '' : genre.name)}
                                className={`flex items-center w-full text-left py-1.5 px-2 text-sm rounded hover:bg-slate-100 ${
                                    selectedGenreName === genre.name ? 'text-tertiary-500 font-medium bg-slate-100' : 'text-gray-700'
                                }`}
                            >
                                <Music className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span className="truncate">{genre.name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {/* Clear Button */}
                {selectedGenreName && (
                    <div className="px-4 pt-2 pb-1 border-t border-slate-100 mt-1">
                        <button
                            onClick={() => setSelectedGenreName('')}
                            className="w-full text-xs text-center py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                            Clear Genre
                        </button>
                    </div>
                )}
            </>
        )}
    </div>
);

// --- Interfaces for UserMenu and SearchBar  ---
interface UserMenuProps {
    session: any;
    status: string;
    isScrolled: boolean;
    setShowUserMenu?: (show: boolean) => void;
    closeMobileMenu?: () => void;
    handleNavigation: (href: string) => void;
}

interface SearchBarProps {
  isScrolled: boolean;
  setSearchQuery: (query: string) => void;
  initialSearchQuery: string;
  selectedCountryCode: string;
  selectedGenreName: string;
  clearFilters: () => void;
}

// --- Standalone SearchBar Component  ---
const SearchBar = ({
  isScrolled,
  setSearchQuery,
  initialSearchQuery,
  selectedCountryCode,
  selectedGenreName,
  clearFilters
}: SearchBarProps) => {
  const [localQuery, setLocalQuery] = useState(initialSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (initialSearchQuery !== localQuery) {
           setLocalQuery(initialSearchQuery);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  const handleSearchSubmit = (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault();
      const queryToSubmit = localQuery.trim();
      setSearchQuery(queryToSubmit);
      inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleSearchSubmit(event);
      }
  };

  const handleClear = () => {
      setLocalQuery('');
      clearFilters();
  };

  return (
      <form
          onSubmit={handleSearchSubmit}
          className="relative md:w-64 lg:w-80"
          role="search"
      >
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
              ref={inputRef}
              type="text"
              placeholder="Search Events... (Press Enter)"
              className={`w-full pl-10 pr-8 py-2 rounded-full border text-sm focus:outline-none ${
                  isScrolled
                      ? 'bg-slate-50 border-slate-200 text-gray-800 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400'
                      : 'bg-primary-400/30 border-primary-400 text-white placeholder:text-white/80 focus:ring-1 focus:ring-secondary-300 focus:border-secondary-300'
              }`}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search events input"
          />
          {(localQuery || selectedCountryCode || selectedGenreName) && (
              <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-offset-1"
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

// --- Standalone UserMenu Component 
const UserMenu = ({ session, status, handleNavigation, setShowUserMenu, closeMobileMenu }: UserMenuProps) => (
    <div className="py-2 bg-white rounded-xl shadow-xl border border-slate-100 w-56"> 
        {status === 'authenticated' ? (
            <>
                <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-primary-700 truncate">{session.user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                </div>
                {/* Profile Link */}
                <button
                    onClick={() => handleNavigation(session.user?.id ? `/dashboard/${session.user.id}` : '/')}
                    className="cursor-pointer flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                    disabled={!session.user?.id} // Disable if no ID
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
                    onClick={() => handleNavigation('/login')}
                    className="cursor-pointer flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
                >
                    <span className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2 flex-shrink-0" />
                        Log In
                    </span>
                    <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                </button>
                <button
                    onClick={() => handleNavigation('/register')}
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
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
      setSelectedCountry: setSelectedCountryCodeDirect,
      setSelectedGenre: setSelectedGenreNameDirect,
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
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounced search handler 
    const handleSearch = useCallback(
        debounce((query: string) => {
            setSearchQuery(query);
        }, 300),
        [setSearchQuery] 
    );

    // Stable handlers for setting filters 
    const setSelectedCountryCodeCallback = useCallback((code: string) => {
        setSelectedCountryCodeDirect(code);
        setShowCountryDropdown(false); // Close country dropdown
    }, [setSelectedCountryCodeDirect]);

    const setSelectedGenreNameCallback = useCallback((name: string) => {
        setSelectedGenreNameDirect(name);
        setShowGenreDropdown(false); // Close genre dropdown
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
            // Close genre dropdown
            if (showGenreDropdown && !target.closest('#genre-filter-container') && !target.closest('#genre-filter-button')) {
                setShowGenreDropdown(false);
            }
            // Close country dropdown
            if (showCountryDropdown && !target.closest('#country-filter-container') && !target.closest('#country-filter-button')) {
                 setShowCountryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen, showUserMenu, showGenreDropdown, showCountryDropdown]);


    // Navigation handler 
    const handleNavigation = useCallback((href: string) => {
        router.push(href);
        // Close all menus/dropdowns on navigation
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
        setShowGenreDropdown(false); // Close genre dropdown
        setShowCountryDropdown(false); // Close country dropdown
    }, [router]);

    // Helper to get country name from code
    const selectedCountryDisplayName = useMemo(() => {
        return uniqueCountries.find(c => c.code === selectedCountryCode)?.name || 'None';
    }, [selectedCountryCode, uniqueCountries]);

    // Helper for genre name display
    const selectedGenreDisplayName = selectedGenreName || 'None';

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
                <div className="flex h-16 items-center justify-between gap-6"> 
                    {/* Logo */}
                    <button
                        onClick={() => handleNavigation('/')}
                        className="cursor-pointer flex items-center flex-shrink-0"
                        aria-label="Go to homepage"
                    >
                        <Calendar className={`h-4 w-4 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
                        <span className="text-2xl font-bold font-brand tracking-tight">
                            live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
                        </span>
                    </button>

                    {/* ---  Filter Controls Area --- */}
                    <div className="hidden lg:flex items-center space-x-4 flex-grow justify-center"> 
                        <span className={`text-sm font-medium mr-2 ${isScrolled ? 'text-gray-500' : 'text-white/90'}`}>Browse By:</span>

                        {/* --- Genre Filter --- */}
                        <div id="genre-filter-container" className="relative">
                            <button
                                id="genre-filter-button"
                                onClick={() => { setShowGenreDropdown(!showGenreDropdown); setShowCountryDropdown(false); }} // Close other dropdown
                                className={`cursor-pointer flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-150 ${
                                    isScrolled
                                        ? `border border-slate-200 ${showGenreDropdown ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-50'} ${selectedGenreName ? 'text-tertiary-600 font-semibold border-tertiary-200 bg-tertiary-50' : 'text-gray-700'}`
                                        : `border border-primary-400/60 ${showGenreDropdown ? 'bg-primary-500/80 border-primary-400' : 'hover:bg-primary-500/50'} ${selectedGenreName ? 'text-secondary-300 font-semibold border-secondary-400/80 bg-primary-500/60' : 'text-white/90'}`
                                }`}
                                aria-haspopup="true"
                                aria-expanded={showGenreDropdown}
                            >
                                <Music className={`h-4 w-4 mr-1.5 flex-shrink-0 ${selectedGenreName ? (isScrolled ? 'text-tertiary-500' : 'text-secondary-300') : ''}`} />
                                Genre: <span className={`ml-1 font-medium truncate max-w-[100px] ${selectedGenreName ? (isScrolled ? 'text-tertiary-700' : 'text-secondary-300') : (isScrolled ? 'text-gray-500' : 'text-white/70')}`}>{selectedGenreDisplayName}</span>
                                <ChevronDown className={`h-4 w-4 ml-1.5 flex-shrink-0 transition-transform duration-200 ${showGenreDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showGenreDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 top-full mt-2 z-20" 
                                    >
                                        <GenreFilterDropdown
                                            uniqueGenres={uniqueGenres}
                                            selectedGenreName={selectedGenreName}
                                            setSelectedGenreName={setSelectedGenreNameCallback} 
                                            isLoading={isLoadingFilters}
                                            filterError={filterError}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Separator */}
                        <div className={`h-4 w-px ${isScrolled ? 'bg-slate-300' : 'bg-primary-400/60'}`}></div>

                         {/* --- Country Filter --- */}
                         <div id="country-filter-container" className="relative">
                            <button
                                id="country-filter-button"
                                onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowGenreDropdown(false); }} // Close other dropdown
                                className={`cursor-pointer flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-150 ${
                                    isScrolled
                                        ? `border border-slate-200 ${showCountryDropdown ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-50'} ${selectedCountryCode ? 'text-tertiary-600 font-semibold border-tertiary-200 bg-tertiary-50' : 'text-gray-700'}`
                                        : `border border-primary-400/60 ${showCountryDropdown ? 'bg-primary-500/80 border-primary-400' : 'hover:bg-primary-500/50'} ${selectedCountryCode ? 'text-secondary-300 font-semibold border-secondary-400/80 bg-primary-500/60' : 'text-white/90'}`
                                }`}
                                aria-haspopup="true"
                                aria-expanded={showCountryDropdown}
                            >
                                <MapPin className={`h-4 w-4 mr-1.5 flex-shrink-0 ${selectedCountryCode ? (isScrolled ? 'text-tertiary-500' : 'text-secondary-300') : ''}`} />
                                Country: <span className={`ml-1 font-medium truncate max-w-[120px] ${selectedCountryCode ? (isScrolled ? 'text-tertiary-700' : 'text-secondary-300') : (isScrolled ? 'text-gray-500' : 'text-white/70')}`}>{selectedCountryDisplayName}</span>
                                <ChevronDown className={`h-4 w-4 ml-1.5 flex-shrink-0 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
                             </button>
                             <AnimatePresence>
                                {showCountryDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 top-full mt-2 z-20" 
                                    >
                                        <CountryFilterDropdown
                                            uniqueCountries={uniqueCountries}
                                            selectedCountryCode={selectedCountryCode}
                                            setSelectedCountryCode={setSelectedCountryCodeCallback} 
                                            isLoading={isLoadingFilters}
                                            filterError={filterError}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Search and User */}
                    <div className="flex items-center gap-4 flex-shrink-0"> 
                       <SearchBar
                            isScrolled={isScrolled}
                            setSearchQuery={setSearchQuery}
                            initialSearchQuery={searchQuery}
                            selectedCountryCode={selectedCountryCode}
                            selectedGenreName={selectedGenreName}
                            clearFilters={clearFilters}
                        />
                        <div className="relative">
                            <button
                                id="user-button"
                                onClick={() => { setShowUserMenu(!showUserMenu); setShowGenreDropdown(false); setShowCountryDropdown(false); }} // Close filter dropdowns
                                className={`flex items-center justify-center p-2 rounded-full transition-colors duration-200 ${
                                    isScrolled ? 'hover:bg-slate-100' : 'hover:bg-primary-500/80'
                                }`}
                                aria-label="User menu"
                                aria-haspopup="true"
                                aria-expanded={showUserMenu}
                            >
                                {status === 'loading' ? (
                                    <Loader2 className={`h-5 w-5 animate-spin ${isScrolled ? 'text-gray-400' : 'text-white/80'}`} />
                                ) : status === 'authenticated' ? (
                                    <div className="cursor-pointer h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                                        {session.user?.name?.[0] || '?'}
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
                                        className="absolute right-0 top-full mt-2 z-20" 
                                    >
                                        <UserMenu
                                            session={session}
                                            status={status}
                                            isScrolled={isScrolled}
                                            setShowUserMenu={setShowUserMenu}
                                            handleNavigation={handleNavigation}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Mobile Menu --- */}
             <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:hidden">
                <div className="flex h-16 items-center justify-between">
                     <button
                        onClick={() => handleNavigation('/')}
                        className="cursor-pointer flex items-center flex-shrink-0 mr-4"
                        aria-label="Go to homepage"
                    >
                        <Calendar className={`h-5 w-5 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
                        <span className="text-2xl font-bold font-brand tracking-tight">
                        live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
                        </span>
                    </button>
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
                        <div className="px-4 pt-4 pb-6 space-y-5 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
                            <SearchBar
                                isScrolled={isScrolled}
                                setSearchQuery={setSearchQuery}
                                initialSearchQuery={searchQuery}
                                selectedCountryCode={selectedCountryCode}
                                selectedGenreName={selectedGenreName}
                                clearFilters={clearFilters}
                            />

                            {/* --- Mobile Filters --- */}
                            <div className="space-y-3 pt-4 border-t border-primary-400/30">
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
                                                onChange={(e) => setSelectedCountryCodeDirect(e.target.value)} // Use direct context setter
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
                                                onChange={(e) => setSelectedGenreNameDirect(e.target.value)} // Use direct context setter
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
                                            // Close menu after clearing:
                                            setIsMobileMenuOpen(false);
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

                             {/* User Section (Mobile - Including Profile Link) */}
                            <div className="pt-4 border-t border-primary-400/30">
                               {status === 'loading' ? (
                                    <div className="flex items-center justify-center p-4">
                                         <Loader2 className={`h-6 w-6 animate-spin ${isScrolled ? 'text-gray-400' : 'text-white/80'}`} />
                                    </div>
                                ) : status === 'authenticated' && session.user ? (
                                    <>
                                    {/* Profile Link Button */}
                                     <button
                                        onClick={() => handleNavigation(`/dashboard/${session.user.id}`)}
                                        className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 mb-3 ${isScrolled ? 'bg-slate-50 text-primary-700 hover:bg-slate-100' : 'bg-primary-400/80 text-white hover:bg-primary-400'}`}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-base uppercase mr-3">
                                            {session.user.name?.[0] || '?'}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className={`font-medium truncate text-sm ${isScrolled ? 'text-primary-700' : 'text-white'}`}>My Profile</p>
                                            <p className={`text-xs truncate ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>{session.user.email}</p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 ml-2 flex-shrink-0" />
                                    </button>
                                    {/* Sign Out Button */}
                                    <button
                                        onClick={() => {
                                            signOut({ callbackUrl: '/' });
                                            setIsMobileMenuOpen(false); // Close menu on sign out
                                        }}
                                        className={`w-full py-2 px-3 text-center rounded-lg font-medium text-sm flex items-center justify-center transition-colors duration-200 ${
                                            isScrolled
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            : 'bg-primary-500/80 text-white hover:bg-primary-500'
                                        }`}
                                    >
                                        <LogOut className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                        Sign Out
                                    </button>
                                    </>

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
                                            className="flex-1 py-2 px-3 text-center rounded-lg font-medium text-sm bg-secondary-500 hover:bg-secondary-600 text-white transition-colors duration-200"
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

            {/* Global Scrollbar Style  */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #94a3b8 transparent; }
             `}</style>
        </nav>
    );
}