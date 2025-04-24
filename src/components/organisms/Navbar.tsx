'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, User, LogIn, MapPin, Music, Filter, ArrowUpRight, 
  Ticket, LogOut, Calendar, X, Menu 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '../../utils/debounce';
import { concertList } from '../data/concertlist';
import { useFilters } from '@/lib/FilterContext';
import { useSession, signOut } from 'next-auth/react';

interface UserMenuProps {
  session: any;
  status: string;
  isScrolled: boolean;
  setShowUserMenu?: (show: boolean) => void;
  closeMobileMenu?: () => void;
}

interface FilterDropdownProps {
  uniqueCountries: string[];
  uniqueGenres: string[];
  selectedCountry: string;
  selectedGenre: string;
  setSelectedCountry: (country: string) => void;
  setSelectedGenre: (genre: string) => void;
}

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  const { data: session, status } = useSession();

  const {
    searchQuery,
    selectedCountry,
    selectedGenre,
    setSearchQuery,
    setSelectedCountry,
    setSelectedGenre,
    clearFilters,
  } = useFilters();

  // Extract countries and genres
  useEffect(() => {
    const countries = Array.from(new Set(concertList.map(event => 
      event.location.split(',').pop()?.trim() ?? ''
    ))).filter(Boolean);
    
    const genres = Array.from(new Set(concertList.flatMap(event => 
      event.genre.split('/').map(g => g.trim())
    ))).filter(Boolean);
    
    setUniqueCountries(countries);
    setUniqueGenres(genres);
  }, []);

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


  // Shared filter dropdown component
  const FilterDropdown = ({
    uniqueCountries,
    uniqueGenres,
    selectedCountry,
    selectedGenre,
    setSelectedCountry,
    setSelectedGenre,
  }: FilterDropdownProps) => (
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
      {(searchQuery || selectedCountry || selectedGenre) && (
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
            className="flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
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
            className="flex items-center w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => handleNavigation('/login')}
            className="flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700"
          >
            <span className="flex items-center">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
          <button 
            onClick={() => handleNavigation('/register')}
            className="flex items-center justify-between w-full text-left py-2 px-4 hover:bg-slate-50 text-gray-700 border-t border-slate-100"
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
      {/* Desktop Menu */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 hidden md:block">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation('/')} 
            className="flex items-center"
          >
            <Calendar className={`h-4 w-4 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
            <span className="text-2xl font-bold font-brand tracking-tight">
              live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
            </span>
          </button>
          {/* Navigation and Filters */}
          <div className="hidden lg:flex items-center space-x-6">
            <NavLinks />
            <div className="relative group">
              <button className="flex items-center font-medium hover:text-tertiary-500 transition-colors">
                Browse <Filter className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute left-0 top-full mt-2 w-56 hidden group-hover:block">
                <FilterDropdown 
                  uniqueCountries={uniqueCountries}
                  uniqueGenres={uniqueGenres}
                  selectedCountry={selectedCountry}
                  selectedGenre={selectedGenre}
                  setSelectedCountry={setSelectedCountry}
                  setSelectedGenre={setSelectedGenre}
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
                  <div className="h-8 w-8 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold">
                    {session.user?.name?.[0] || 'U'}
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

      {/* Mobile Menu Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:hidden">
        <div className="flex justify-end h-16 items-center">
          <button 
            id="menu-button"
            className="p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden ${isScrolled ? 'bg-white' : 'bg-primary-500'}`}
          >
            <div className="px-4 py-6 space-y-4">
            <Link href="/" className="flex items-center">
            <Calendar className={`h-4 w-4 mr-2 ${isScrolled ? 'text-primary-700' : 'text-white'}`} />
            <span className="text-2xl font-bold font-brand tracking-tight">
              live<span className={`${isScrolled ? 'text-tertiary-500' : 'text-secondary-400'}`}>wave</span>
            </span>
          </Link>
              <NavLinks mobile />
              <div className="space-y-3">
                <p className={`font-medium ${isScrolled ? 'text-primary-700' : 'text-white'}`}>Filter by Country</p>
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 ${
                    isScrolled ? 'bg-slate-50 border border-slate-200 text-gray-700' : 'bg-primary-400 text-white'
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
                    isScrolled ? 'bg-slate-50 border border-slate-200 text-gray-700' : 'bg-primary-400 text-white'
                  }`}
                >
                  <option value="">All Genres</option>
                  {uniqueGenres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-primary-400">
                {status === 'authenticated' ? (
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-tertiary-500 flex items-center justify-center text-white font-bold">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className={`font-medium ${isScrolled ? 'text-primary-700' : 'text-white'}`}>{session.user?.name || 'User'}</p>
                      <p className={`text-sm ${isScrolled ? 'text-gray-500' : 'text-primary-200'}`}>{session.user?.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setIsMobileMenuOpen(false);
                      }}
                      className={`ml-auto p-2 rounded-full ${
                        isScrolled ? 'bg-slate-50 text-primary-700' : 'bg-primary-400 text-white'
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
                        isScrolled ? 'bg-slate-50 text-primary-700' : 'bg-primary-400 text-white'
                      }`}
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/register"
                      className="flex-1 py-2 text-center rounded-lg font-medium bg-secondary-600 text-white"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
              {(searchQuery || selectedCountry || selectedGenre) && (
                <button 
                  onClick={() => {
                    clearFilters();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2 rounded-lg flex items-center justify-center font-medium ${
                    isScrolled ? 'bg-primary-100 text-primary-700' : 'bg-primary-400 text-white'
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
    </nav>
  );
}