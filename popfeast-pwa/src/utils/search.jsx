import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from '../api/base.js';

const SearchSortContext = createContext(null);

const MOVIE_SORTS = [
  { value: 'rating', label: 'Rating' },
  { value: 'year', label: 'Release Year' },
  { value: 'duration_minutes', label: 'Duration' },
  { value: 'genres', label: 'Genres' },
  { value: 'title', label: 'Title' }
];
const SERIES_SORTS = [
  { value: 'rating', label: 'Rating' },
  { value: 'seasons', label: 'Seasons' },
  { value: 'episodes', label: 'Episodes' },
  { value: 'genres', label: 'Genres' },
  { value: 'title', label: 'Title' }
];

export function SearchSortProvider({ children }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rating');
  const [order, setOrder] = useState('desc');
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(()=>{
    fetch(apiUrl('/api/meta/genres'))
      .then(r=>r.json())
      .then(j=>setAllGenres(j.genres||[]))
      .catch(()=>{});
  },[]);

  useEffect(()=>{
    if (allGenres && allGenres.length) return;
    Promise.all([
      fetch(apiUrl('/api/movies')).then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch(apiUrl('/api/series')).then(r=>r.ok?r.json():[]).catch(()=>[])
    ]).then(([m,s])=>{
      const set = new Set();
      (Array.isArray(m)? m:[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
      (Array.isArray(s)? s:[]).forEach(r => (r.genres||[]).forEach(g=>set.add(g)));
      const arr = Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
      if (arr.length) setAllGenres(arr);
    }).catch(()=>{});
  }, [allGenres]);

  function toggleGenre(g){
    setSelectedGenres(prev => prev.includes(g)? prev.filter(x=>x!==g) : [...prev,g]);
  }
  function clearGenres(){ setSelectedGenres([]); }

  return (
    <SearchSortContext.Provider value={{
      query,setQuery,
      sort,setSort,
      order,setOrder,
      MOVIE_SORTS, SERIES_SORTS,
      allGenres, selectedGenres, toggleGenre, clearGenres
    }}>
      {children}
    </SearchSortContext.Provider>
  );
}

export function useSearchSort(){
  return useContext(SearchSortContext);
}
