import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { Scale, Sparkles, ArrowRight, Flame, Eye } from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';

export const Home: React.FC = () => {
  const { addToCompare, isInCompare } = useApp();
  const [mostViewed, setMostViewed] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_URL}/phones/trending`);
        if (res.ok) {
          const data = await res.json();
          setMostViewed(data.mostViewed);
        }
      } catch (err) {
        console.error('Error fetching trending phones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleQuickCompare = (id1: number, id2: number) => {
    navigate(`/compare?ids=${id1},${id2}`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 bg-background text-foreground">
      {/* 1. Hero Block */}
      <header className="relative flex flex-col items-center justify-center py-20 text-center max-w-4xl mx-auto">
        <div className="z-10 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <Sparkles className="h-3 w-3 text-amber-500" />
            AI-Driven Decision Engine
          </span>
          
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl font-sans text-foreground">
            Find Your Perfect Smartphone
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Compare phones, analyze specifications, and get smart recommendations before you buy.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background hover:bg-neutral-800 transition-all shadow-md"
            >
              <Scale className="h-4 w-4" />
              Compare Phones
            </Link>
            <Link
              to="/finder"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-7 py-3 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Find Best Phone
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Popular Head-to-Head Comparisons */}
      <section className="mt-12 py-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="mb-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Popular Face-Offs
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Premium Duel */}
          <div className="glass-card flex flex-col justify-between rounded-2xl p-6 text-left border border-border bg-white shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Premium Flagships</div>
              <h3 className="mt-2 text-base font-bold text-foreground">Galaxy S24 Ultra vs iPhone 15 Pro Max</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">The ultimate battle of camera zoom, Titanium frames, and peak speeds.</p>
            </div>
            <button
              onClick={() => handleQuickCompare(1, 2)}
              className="mt-6 flex items-center justify-center gap-1 rounded-lg bg-neutral-100 py-2.5 text-xs font-bold hover:bg-neutral-200 transition-colors text-foreground"
            >
              Compare Matchup <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Card 2: Value Gaming Duel */}
          <div className="glass-card flex flex-col justify-between rounded-2xl p-6 text-left border border-border bg-white shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Flagship Killers</div>
              <h3 className="mt-2 text-base font-bold text-foreground">Poco F6 vs OnePlus 12</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Is the OnePlus 12 flagship experience worth double the price of the Poco gaming king?</p>
            </div>
            <button
              onClick={() => handleQuickCompare(7, 3)}
              className="mt-6 flex items-center justify-center gap-1 rounded-lg bg-neutral-100 py-2.5 text-xs font-bold hover:bg-neutral-200 transition-colors text-foreground"
            >
              Compare Matchup <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Card 3: Midrange Design Duel */}
          <div className="glass-card flex flex-col justify-between rounded-2xl p-6 text-left border border-border bg-white shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Best Under ₹35,000</div>
              <h3 className="mt-2 text-base font-bold text-foreground">Nothing Phone (2a) vs Redmi Note 13 Pro+</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Compare glyph light transparency design against a high-res 200MP camera curve.</p>
            </div>
            <button
              onClick={() => handleQuickCompare(5, 6)}
              className="mt-6 flex items-center justify-center gap-1 rounded-lg bg-neutral-100 py-2.5 text-xs font-bold hover:bg-neutral-200 transition-colors text-foreground"
            >
              Compare Matchup <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Trending Products Grid */}
      <section className="mt-16 py-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="mb-8 flex items-center justify-between border-b border-border pb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground md:text-xl">
            <Flame className="h-5 w-5 text-amber-500 fill-current" />
            Trending This Week
          </h2>
          <Link to="/trending" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
            View All Leaderboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 w-full animate-pulse rounded-2xl border border-border bg-neutral-50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mostViewed.slice(0, 4).map((phone) => {
              const compared = isInCompare(phone.id);
              return (
                <div key={phone.id} className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left border border-border bg-white shadow-sm hover:border-primary">
                  {/* Phone Image Container */}
                  <div className="relative mb-4 flex h-40 items-center justify-center rounded-xl bg-neutral-50 p-4 transition-transform group-hover:scale-[1.02]">
                    <img src={phone.image_url} alt={phone.model} className="h-full max-h-36 object-contain" />
                    
                    {/* Overall score badge */}
                    <div className="absolute right-2 top-2">
                      <ScoreGauge score={phone.overall_score} label="" size="sm" />
                    </div>
                  </div>

                  {/* Phone Info */}
                  <div>
                    <div className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">{phone.brand_name}</div>
                    <h3 className="mt-0.5 text-base font-bold text-foreground group-hover:text-secondary transition-colors truncate">
                      {phone.model}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{phone.processor}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground font-semibold">Launched: {phone.launch_date}</p>
                    
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-foreground">₹{phone.price_inr.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Eye className="h-3 w-3" /> {phone.views_count} views
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
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
                          ? 'bg-primary/10 text-amber-800 border border-primary/20'
                          : 'bg-primary text-foreground hover:bg-secondary'
                      }`}
                    >
                      {compared ? 'Compared' : '+ Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Feature Promo Section */}
      <section className="mt-20 py-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="glass-panel grid gap-8 rounded-3xl p-8 md:grid-cols-2 md:p-12 text-left items-center border border-border bg-white shadow-sm">
          <div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-secondary">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Can't Decide? Use our Phone Finder.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Select your budget segment and primary usage parameters (Gaming, Video Editing, Photography, or daily battery endurance) and let our analyzer algorithm recommend the absolute best matches.
            </p>
            <Link
              to="/finder"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline"
            >
              Start Phone Finder Wizard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-50 border border-border p-5">
              <div className="text-xs font-bold text-amber-600">01. Setup Budget</div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">Select pricing filters starting from budget devices under ₹10k to premium flagships.</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-border p-5">
              <div className="text-xs font-bold text-blue-600">02. Setup Usage</div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">Tick boxes like Gaming, Professional Camera, or long battery life.</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-border p-5">
              <div className="text-xs font-bold text-indigo-600">03. Compare Scores</div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">Check overall match percentages calculated specifically for your needs.</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-border p-5">
              <div className="text-xs font-bold text-emerald-600">04. AI Verdict</div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">Read dynamic pros/cons and clear explanations of why we recommend the phone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Chat assistant promo banner */}
      <section className="mt-16 py-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="rounded-3xl border border-border bg-muted p-8 md:p-12 text-center relative overflow-hidden">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Talk to Smartphone Compare AI Platform Tech Advisor
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Have a hyper-specific question? Ask our AI chat console! Try typing: *"I need a slim phone under ₹40,000 with OIS and Zeiss camera."*
          </p>
          <Link
            to="/assistant"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors shadow-sm"
          >
            Launch Chat Assistant
          </Link>
        </div>
      </section>
    </div>
  );
};
