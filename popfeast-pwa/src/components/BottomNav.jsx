import React from 'react';
import { NavLink } from 'react-router-dom';
// Uses lucide-react icons; ensure dependency installed
import { Home, Film, Tv, Heart, User } from 'lucide-react';
const items = [
  { to: '/movies', label: 'Movies', Icon: Film },
  { to: '/series', label: 'Series', Icon: Tv },
  { to: '/', label: 'Home', Icon: Home, isHome: true },
  { to: '/favorites', label: 'Fav', Icon: Heart },
  { to: '/profile', label: 'Profile', Icon: User }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-inner">
        {items.map(({to,label,Icon,isHome}) => (
          <NavLink key={to} to={to} end={isHome} className={({ isActive }) => `bottom-link${isHome ? ' bottom-home' : ''}${isActive ? ' active' : ''}`}>
            <Icon className="nav-icon" size={isHome?22:20} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}