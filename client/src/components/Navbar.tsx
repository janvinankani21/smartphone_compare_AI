import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import { Search, Scale, Heart, Sparkles, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, compareList, wishlistIds } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load suggestions from API when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/phones/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(false);
      navigate(`/trending?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (phoneId: number) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearching(false);
    navigate(`/phone/${phoneId}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent font-sans">
            SMARTPHONE COMPARE<span className="text-white font-light font-mono">.AI</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div ref={searchRef} className="relative hidden w-full max-w-md md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Samsung, iPhone, OnePlus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                className="w-full rounded-full bg-secondary/60 py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground outline-none ring-1 ring-border focus:ring-accent transition-all duration-300"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearching && suggestions.length > 0 && (
            <div className="absolute top-11 z-50 w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-xl">
              {suggestions.map((phone) => (
                <div
                  key={phone.id}
                  onClick={() => handleSuggestionClick(phone.id)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/80 transition-colors"
                >
                  <img src={phone.image_url} alt={phone.model} className="h-8 w-8 rounded object-cover" />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-accent">{phone.brand_name}</div>
                    <div className="text-sm font-medium text-white">{phone.model}</div>
                  </div>
                  <div className="ml-auto text-xs font-mono text-muted-foreground">
                    ₹{phone.price_inr.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links & Buttons - Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/compare" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            <Scale className="h-4 w-4" />
            Compare
            {compareList.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black animate-pulse">
                {compareList.length}
              </span>
            )}
          </Link>
          
          <Link to="/finder" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Finder
          </Link>

          <Link to="/assistant" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            <User className="h-4 w-4 text-cyan-400" />
            AI Chat
          </Link>

          {/* Wishlist Icon */}
          <Link to="/wishlist" className="relative text-muted-foreground hover:text-white transition-colors">
            <Heart className="h-5 w-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* User Section */}
          {user ? (
            <div ref={userDropdownRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-secondary/80 p-1 pr-3 text-sm font-medium hover:bg-secondary transition-all"
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'}
                  alt={user.full_name}
                  className="h-6 w-6 rounded-full"
                />
                <span className="max-w-[80px] truncate text-xs">{user.full_name.split(' ')[0]}</span>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-9 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                  <div className="border-b border-border p-3 text-left">
                    <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/wishlist"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-white transition-colors"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Saved Devices
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-xs font-medium text-rose-400 hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/compare" className="relative text-muted-foreground">
            <Scale className="h-5 w-5" />
            {compareList.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-black">
                {compareList.length}
              </span>
            )}
          </Link>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:hidden animate-fade-in">
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-secondary/80 py-2 pl-10 pr-4 text-sm text-white placeholder-muted-foreground outline-none ring-1 ring-border"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </form>

          <Link
            to="/compare"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground hover:text-white"
          >
            <Scale className="h-4 w-4" />
            Compare Bucket ({compareList.length})
          </Link>

          <Link
            to="/finder"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Best Phone Finder
          </Link>

          <Link
            to="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground hover:text-white"
          >
            <User className="h-4 w-4 text-cyan-400" />
            AI Chat Assistant
          </Link>

          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground hover:text-white"
          >
            <Heart className="h-4 w-4 text-rose-500" />
            My Wishlist ({wishlistIds.length})
          </Link>

          {user && user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {user ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-white">{user.full_name}</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 w-full rounded-full bg-white py-2 text-center text-sm font-semibold text-black hover:bg-neutral-200"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
