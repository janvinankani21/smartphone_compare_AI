import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { SlidersHorizontal, Filter, RotateCcw } from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';

export const Trending: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCompare, isInCompare } = useApp();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [processor, setProcessor] = useState(searchParams.get('processor') || '');
  const [ram, setRam] = useState(searchParams.get('ram') || '');
  const [storage, setStorage] = useState(searchParams.get('storage') || '');
  const [refreshRate, setRefreshRate] = useState(searchParams.get('refreshRate') || '');
  const [amoled, setAmoled] = useState(searchParams.get('amoled') === 'true');
  const [support5g, setSupport5g] = useState(searchParams.get('support5g') === 'true');
  const [nfc, setNfc] = useState(searchParams.get('nfc') === 'true');
  const [wirelessCharging, setWirelessCharging] = useState(searchParams.get('wirelessCharging') === 'true');

  const brandOptions = ['Apple', 'Samsung', 'OnePlus', 'Google', 'Nothing', 'Xiaomi', 'Oppo', 'Vivo', 'Motorola'];

  useEffect(() => {
    fetchFilteredPhones();
  }, [searchParams]);

  const fetchFilteredPhones = async () => {
    setLoading(true);
    try {
      // Build query string
      const qParams = new URLSearchParams();
      searchParams.forEach((val, key) => {
        qParams.append(key, val);
      });

      const res = await fetch(`${API_URL}/phones?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // If searching via search bar, filter clientside by model or brand as well
        const searchQuery = searchParams.get('search')?.toLowerCase();
        if (searchQuery) {
          const filtered = data.filter((p: Phone) =>
            p.model.toLowerCase().includes(searchQuery) ||
            p.brand_name.toLowerCase().includes(searchQuery) ||
            p.processor.toLowerCase().includes(searchQuery)
          );
          setPhones(filtered);
        } else {
          setPhones(data);
        }
      }
    } catch (err) {
      console.error('Error querying filtered phones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (brand) params.brand = brand;
    if (maxPrice) params.maxPrice = maxPrice;
    if (processor) params.processor = processor;
    if (ram) params.ram = ram;
    if (storage) params.storage = storage;
    if (refreshRate) params.refreshRate = refreshRate;
    if (amoled) params.amoled = 'true';
    if (support5g) params.support5g = 'true';
    if (nfc) params.nfc = 'true';
    if (wirelessCharging) params.wirelessCharging = 'true';

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setBrand('');
    setMaxPrice('');
    setProcessor('');
    setRam('');
    setStorage('');
    setRefreshRate('');
    setAmoled(false);
    setSupport5g(false);
    setNfc(false);
    setWirelessCharging(false);
    setSearchParams({});
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left">
      {/* Head */}
      <header className="mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" /> Specs Explorer
        </span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white font-sans">
          Smartphone Catalog
        </h1>
        {searchParams.get('search') && (
          <p className="mt-1 text-xs text-muted-foreground">
            Showing results for query: <span className="text-accent font-bold">"{searchParams.get('search')}"</span>
          </p>
        )}
      </header>

      {/* Main filters split grid */}
      <div className="grid gap-8 md:grid-cols-4">
        {/* Left Side: Filter Form Panel (1/4 width) */}
        <div className="glass-panel h-fit rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h3>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="space-y-5 text-xs">
            {/* Brand Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
              >
                <option value="">All Brands</option>
                {brandOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Max Budget Limit */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Budget (INR)</label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
              >
                <option value="">No Limit</option>
                <option value="15000">Under ₹15,000</option>
                <option value="25000">Under ₹25,000</option>
                <option value="40000">Under ₹40,000</option>
                <option value="70000">Under ₹70,000</option>
                <option value="100000">Under ₹1,00,000</option>
              </select>
            </div>

            {/* Processor Filter input */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Processor Brand</label>
              <input
                type="text"
                placeholder="e.g. Snapdragon, Tensor"
                value={processor}
                onChange={(e) => setProcessor(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white placeholder-muted-foreground outline-none"
              />
            </div>

            {/* RAM options */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Min RAM</label>
              <select
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
              >
                <option value="">Any RAM</option>
                <option value="6">6 GB and above</option>
                <option value="8">8 GB and above</option>
                <option value="12">12 GB and above</option>
              </select>
            </div>

            {/* Storage options */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Storage</label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
              >
                <option value="">Any Storage</option>
                <option value="64">64 GB and above</option>
                <option value="128">128 GB and above</option>
                <option value="256">256 GB and above</option>
              </select>
            </div>

            {/* Feature Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Hardware Features</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                  <input
                    type="checkbox"
                    checked={amoled}
                    onChange={(e) => setAmoled(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>AMOLED / OLED Screen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                  <input
                    type="checkbox"
                    checked={support5g}
                    onChange={(e) => setSupport5g(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>5G Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                  <input
                    type="checkbox"
                    checked={nfc}
                    onChange={(e) => setNfc(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>NFC Chipset</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white">
                  <input
                    type="checkbox"
                    checked={wirelessCharging}
                    onChange={(e) => setWirelessCharging(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>Wireless Charging</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Right Side: Phone Cards Deck (3/4 width) */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 w-full animate-pulse rounded-2xl border border-border bg-card/30" />
              ))}
            </div>
          ) : phones.length === 0 ? (
            <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-12 text-center">
              <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-base font-bold text-white">No Phones Found</h2>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                Try widening your search terms or unchecking feature parameters in the sidebar filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {phones.map((phone) => {
                const compared = isInCompare(phone.id);
                return (
                  <div key={phone.id} className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left">
                    <div className="relative mb-4 flex h-36 items-center justify-center rounded-xl bg-secondary/20 p-4 transition-transform group-hover:scale-[1.02]">
                      <img src={phone.image_url} alt={phone.model} className="h-full max-h-32 object-contain" />
                      <div className="absolute right-2 top-2">
                        <ScoreGauge score={phone.overall_score} label="" size="sm" />
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-bold text-accent uppercase tracking-wide">{phone.brand_name}</div>
                      <h3 className="mt-0.5 text-base font-bold text-white group-hover:text-accent transition-colors">
                        {phone.model}
                      </h3>
                      <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{phone.processor}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground font-semibold">Launched: {phone.launch_date}</p>

                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-sm font-black text-white">₹{phone.price_inr.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          RAM: {phone.ram_gb}GB | ROM: {phone.storage_gb}GB
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/phone/${phone.id}`}
                        className="flex-1 rounded-lg border border-border bg-secondary/40 py-2 text-center text-xs font-bold text-white hover:bg-secondary"
                      >
                        Specs
                      </Link>
                      <button
                        onClick={() => addToCompare(phone)}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                          compared
                            ? 'bg-accent/20 text-accent border border-accent/40'
                            : 'bg-white text-black hover:bg-neutral-200'
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
      </div>
    </div>
  );
};
