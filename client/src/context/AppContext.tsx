import React, { createContext, useState, useEffect, useContext } from 'react';

// API Base URL
export const API_URL = 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'user';
}

export interface Phone {
  id: number;
  brand_id: number;
  brand_name: string;
  model: string;
  launch_date: string;
  price_inr: number;
  display_size: number;
  display_type: string;
  refresh_rate: number;
  resolution: string;
  processor: string;
  gpu: string;
  ram_gb: number;
  storage_gb: number;
  expandable_storage: boolean;
  rear_camera_spec: string;
  front_camera_spec: string;
  battery_capacity: number;
  charging_speed: number;
  wireless_charging: boolean;
  android_version: string;
  software_updates_years: number;
  weight_g: number;
  build_quality: string;
  ip_rating: string;
  network_support: string;
  overall_score: number;
  performance_score: number;
  camera_score: number;
  battery_score: number;
  gaming_score: number;
  display_score: number;
  value_for_money_score: number;
  pros: string[] | string;
  cons: string[] | string;
  image_url: string;
  views_count?: number;
  comparison_count?: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  compareList: Phone[];
  wishlistIds: number[];
  authLoading: boolean;
  login: (userData: { user: User; token: string }) => void;
  logout: () => void;
  addToCompare: (phone: Phone) => boolean;
  removeFromCompare: (phoneId: number) => void;
  clearCompare: () => void;
  toggleWishlist: (phoneId: number) => Promise<boolean>;
  isInCompare: (phoneId: number) => boolean;
  isInWishlist: (phoneId: number) => boolean;
  fetchWishlist: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<Phone[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Load auth state and comparison list from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sc_user');
    const storedToken = localStorage.getItem('sc_token');
    const storedCompare = localStorage.getItem('sc_compare');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    if (storedCompare) {
      setCompareList(JSON.parse(storedCompare));
    }
    setAuthLoading(false);
  }, []);

  // Fetch user wishlist once token is loaded
  useEffect(() => {
    if (token) {
      fetchWishlist();
    } else {
      setWishlistIds([]);
    }
  }, [token]);

  const login = (userData: { user: User; token: string }) => {
    setUser(userData.user);
    setToken(userData.token);
    localStorage.setItem('sc_user', JSON.stringify(userData.user));
    localStorage.setItem('sc_token', userData.token);
    setCompareList([]);
    localStorage.removeItem('sc_compare');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWishlistIds([]);
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    setCompareList([]);
    localStorage.removeItem('sc_compare');
  };

  // Add to comparison list (Max 4 phones)
  const addToCompare = (phone: Phone): boolean => {
    if (compareList.some((p) => p.id === phone.id)) {
      return true; // Already added
    }
    if (compareList.length >= 4) {
      return false; // Limit reached
    }
    const updated = [...compareList, phone];
    setCompareList(updated);
    localStorage.setItem('sc_compare', JSON.stringify(updated));
    return true;
  };

  // Remove from comparison list
  const removeFromCompare = (phoneId: number) => {
    const updated = compareList.filter((p) => p.id !== phoneId);
    setCompareList(updated);
    localStorage.setItem('sc_compare', JSON.stringify(updated));
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem('sc_compare');
  };

  const isInCompare = (phoneId: number): boolean => {
    return compareList.some((p) => p.id === phoneId);
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.map((item: any) => item.id));
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  // Toggle Wishlist
  const toggleWishlist = async (phoneId: number): Promise<boolean> => {
    if (!token) {
      return false; // Requires login
    }
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phoneId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.added) {
          setWishlistIds((prev) => [...prev, phoneId]);
          return true;
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== phoneId));
          return false;
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
    return false;
  };

  const isInWishlist = (phoneId: number): boolean => {
    return wishlistIds.includes(phoneId);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        compareList,
        wishlistIds,
        authLoading,
        login,
        logout,
        addToCompare,
        removeFromCompare,
        clearCompare,
        toggleWishlist,
        isInCompare,
        isInWishlist,
        fetchWishlist
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
