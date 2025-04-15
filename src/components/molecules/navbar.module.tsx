'use client';
import { useState, useCallback, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/solid';
import { debounce } from '../../utils/debounce';
import { ConcertEvent, concertList } from '../data/concertlist'; // Adjust import path

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);

  // Get unique locations and genres from concert data
  useEffect(() => {
    const locations = Array.from(new Set(concertList.map(event => event.location)));
    const genres = Array.from(new Set(concertList.flatMap(event => 
      event.genre.split('/').map(g => g.trim())
    )));
    setUniqueLocations(locations);
    setUniqueGenres(genres);
  }, []);

  const handleSearch = useCallback(
    debounce((query: string) => {
      console.log('Searching for:', query);
    }, 300),
    []
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedGenre('');
  };

  return (
    <nav className="bg-primary-500 text-white shadow-sm">
      {/* Desktop Navbar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-bold">EventHub</a>
            
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-2">
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-primary-400 rounded-base px-3 py-1"
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <select 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-primary-400 rounded-base px-3 py-1"
              >
                <option value="">All Genres</option>
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Middle Section - Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-3 py-2 rounded-base bg-primary-300"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
              {(searchQuery || selectedLocation || selectedGenre) && (
                <button 
                  onClick={clearFilters}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button className="hover:text-primary-100">Profile</button>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="hover:text-primary-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="hover:text-primary-100">Login</a>
                <a href="/register" className="hover:text-primary-100">Register</a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-4">
          {/* Mobile Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 pr-3 py-2 rounded-base bg-primary-300"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>

          {/* Mobile Filters */}
          <div className="space-y-2">
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-primary-400 rounded-base px-3 py-2"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select 
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-primary-400 rounded-base px-3 py-2"
            >
              <option value="">All Genres</option>
              {uniqueGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Mobile Auth */}
          <div className="flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <button className="text-left py-2 hover:text-primary-100">Profile</button>
                <button 
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 hover:text-primary-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="py-2 hover:text-primary-100">Login</a>
                <a href="/register" className="py-2 hover:text-primary-100">Register</a>
              </>
            )}
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedLocation || selectedGenre) && (
            <button 
              onClick={clearFilters}
              className="w-full py-2 bg-primary-400 rounded-base hover:bg-primary-300"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </nav>
  );
}