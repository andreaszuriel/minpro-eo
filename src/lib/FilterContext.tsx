'use client';


import { createContext, useState, useContext, ReactNode } from 'react';

interface FilterContextType {
  searchQuery: string;
  selectedCountry: string;
  selectedGenre: string;
  setSearchQuery: (query: string) => void;
  setSelectedCountry: (country: string) => void;
  setSelectedGenre: (genre: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('');
    setSelectedGenre('');
  };

  return (
    <FilterContext.Provider
      value={{
        searchQuery,
        selectedCountry,
        selectedGenre,
        setSearchQuery,
        setSelectedCountry,
        setSelectedGenre,
        clearFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}