'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { debounce } from '../../utils/debounce';
import { concertList } from '../data/concertlist';
import { useFilters } from '@/lib/FilterContext';
import DesktopMenu from '../molecules/DesktopMenu';
import MobileMenu from '../molecules/MobileMenu';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const {
    searchQuery,
    selectedCountry,
    selectedGenre,
    setSearchQuery,
    setSelectedCountry,
    setSelectedGenre,
    clearFilters
  } = useFilters();

  // Extract countries and genres
  useEffect(() => {
    const countries = Array.from(new Set(concertList.map(event => {
      const locationParts = event.location.split(',');
      return locationParts[locationParts.length - 1].trim();
    })));
    
    const genres = Array.from(new Set(concertList.flatMap(event => 
      event.genre.split('/').map(g => g.trim())
    )));
    
    setUniqueCountries(countries);
    setUniqueGenres(genres);
  }, []);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle search
  const handleSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    [setSearchQuery]
  );

  // Close menus on click outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, showUserMenu]);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white text-primary-700 shadow-lg' 
          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
      }`}
    >
      {/* Desktop Menu */}
      <DesktopMenu
        isScrolled={isScrolled}
        searchQuery={searchQuery}
        selectedCountry={selectedCountry}
        selectedGenre={selectedGenre}
        handleSearch={handleSearch}
        clearFilters={clearFilters}
        uniqueCountries={uniqueCountries}
        uniqueGenres={uniqueGenres}
        setSelectedCountry={setSelectedCountry}
        setSelectedGenre={setSelectedGenre}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

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
      <MobileMenu
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        searchQuery={searchQuery}
        selectedCountry={selectedCountry}
        selectedGenre={selectedGenre}
        clearFilters={clearFilters}
        uniqueCountries={uniqueCountries}
        uniqueGenres={uniqueGenres}
        setSelectedCountry={setSelectedCountry}
        setSelectedGenre={setSelectedGenre}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />
    </nav>
  );
}