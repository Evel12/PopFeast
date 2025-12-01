import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LayoutMobile from './components/LayoutMobile.jsx';
import Movies from './pages/Movies.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Series from './pages/Series.jsx';
import SeriesDetail from './pages/SeriesDetail.jsx';
import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/admin.jsx';
import Home from './pages/Home.jsx';
import { SearchSortProvider } from './context/SearchSortContext.jsx';
import './index.css';
import './App.css';

export default function App() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 880px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 880px)');
    const onChange = (e) => setIsMobile(e.matches);
    // modern browsers
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  const Shell = isMobile ? LayoutMobile : Layout;
  return (
    <BrowserRouter>
      <SearchSortProvider>
        <Routes>
          <Route path="/" element={<Shell />}> 
            <Route index element={<Home />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movies/:id" element={<MovieDetail />} />
            <Route path="series" element={<Series />} />
            <Route path="series/:id" element={<SeriesDetail />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </SearchSortProvider>
    </BrowserRouter>
  );
}