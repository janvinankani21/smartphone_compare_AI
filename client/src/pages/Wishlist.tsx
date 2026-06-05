import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { Heart, Scale, Trash2, ArrowRight } from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';

export const Wishlist: React.FC = () => {
  const { token, toggleWishlist, addToCompare, isInCompare } = useApp();
  const navigate = useNavigate();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchSavedPhones();
  }, [token]);

  const fetchSavedPhones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPhones(data);
      }
    } catch (err) {
      console.error('Error fetching wishlisted devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (phoneId: number) => {
    await toggleWishlist(phoneId);
    setPhones(phones.filter(p => p.id !== phoneId));
  };

  const handleCompareAll = () => {
    if (phones.length === 0) return;
    const ids = phones.slice(0, 4).map(p => p.id).join(',');
    navigate(`/compare?ids=${ids}`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left bg-background text-foreground">
      {/* Head */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary uppercase tracking-wider">
            <Heart className="h-3.5 w-3.5 text-rose-500" /> User Space
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground font-sans">
            My Wishlist
          </h1>
        </div>
        {phones.length > 1 && (
          <button
            onClick={handleCompareAll}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors shadow-sm"
          >
            <Scale className="h-3.5 w-3.5" /> Compare All ({Math.min(4, phones.length)})
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : phones.length === 0 ? (
        /* Empty wishlist */
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center border border-border bg-white shadow-sm">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-base font-bold text-foreground">Your Wishlist is Empty</h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
            Explore the catalog and click the Heart icon on any device to save them for comparison later.
          </p>
          <Link
            to="/trending"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary shadow-sm"
          >
            Browse Catalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        /* Wishlist grid list */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {phones.map((phone) => {
            const compared = isInCompare(phone.id);
            return (
              <div key={phone.id} className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left border border-border bg-white shadow-sm hover:border-primary relative">
                
                {/* Remove button */}
                <button
                  onClick={() => handleUnsave(phone.id)}
                  className="absolute right-3 top-3 rounded-full bg-neutral-50 border border-border p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Cover visual */}
                <div className="relative mb-4 flex h-36 items-center justify-center rounded-xl bg-neutral-50 p-4 border border-border/50 transition-transform group-hover:scale-[1.02]">
                  <img src={phone.image_url} alt={phone.model} className="h-full max-h-32 object-contain" />
                  <div className="absolute left-2 top-2">
                    <ScoreGauge score={phone.overall_score} label="" size="sm" />
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">{phone.brand_name}</div>
                  <h3 className="mt-0.5 text-base font-bold text-foreground group-hover:text-secondary transition-colors truncate">
                    {phone.model}
                  </h3>
                  <div className="mt-2 text-sm font-black text-foreground">₹{phone.price_inr.toLocaleString()}</div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/phone/${phone.id}`}
                    className="flex-1 rounded-lg border border-border bg-neutral-50 py-2 text-center text-xs font-bold text-foreground hover:bg-neutral-100 transition-colors"
                  >
                    Specs
                  </Link>
                  <button
                    onClick={() => addToCompare(phone)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      compared
                        ? 'bg-primary/20 text-amber-800 border border-primary/30'
                        : 'bg-primary text-foreground hover:bg-secondary'
                    }`}
                  >
                    {compared ? 'In Bucket' : '+ Compare'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

