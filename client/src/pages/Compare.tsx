import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { Scale, Trash2, Plus, Sparkles, X, Search, Trophy, FileText } from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';

export const Compare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { compareList, addToCompare, removeFromCompare, clearCompare } = useApp();
  
  const [phones, setPhones] = useState<Phone[]>([]);
  const [aiVerdict, setAiVerdict] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  // Synchronize URL query parameters with local state and AppContext
  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      fetchComparedPhones(ids);
    } else if (compareList.length > 0) {
      // If there are items in the global compare list, update the URL params
      const ids = compareList.map(p => p.id).join(',');
      setSearchParams({ ids });
    } else {
      setPhones([]);
      setAiVerdict('');
      setLoading(false);
    }
  }, [searchParams, compareList]);

  const fetchComparedPhones = async (ids: number[]) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/phones/compare?ids=${ids.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setPhones(data.phones);
        setAiVerdict(data.aiRecommendation);
        
        // Push missing items to compare context
        data.phones.forEach((p: Phone) => {
          addToCompare(p);
        });
      }
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch search matches for adding slot
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/phones/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchSearch, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRemove = (phoneId: number) => {
    removeFromCompare(phoneId);
    const updatedPhones = phones.filter(p => p.id !== phoneId);
    if (updatedPhones.length > 0) {
      setSearchParams({ ids: updatedPhones.map(p => p.id).join(',') });
    } else {
      setSearchParams({});
      clearCompare();
    }
  };

  const handleAddSlotClick = (_slotIdx: number) => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setIsSearchOpen(true);
  };

  const handleSelectPhone = async (phoneId: number) => {
    setIsSearchOpen(false);
    try {
      const res = await fetch(`${API_URL}/phones/${phoneId}`);
      if (res.ok) {
        const data = await res.json();
        const success = addToCompare(data.phone);
        if (success) {
          const updatedIds = [...phones.map(p => p.id), phoneId];
          setSearchParams({ ids: updatedIds.join(',') });
        } else {
          alert('You can only compare up to 4 phones at once!');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Specification comparison highlight helper
  // Evaluates a field across all loaded phones and returns 'spec-better', 'spec-worse', or 'spec-similar'
  const getHighlightClass = (phone: Phone, fieldName: keyof Phone, invertBetter: boolean = false) => {
    if (phones.length <= 1) return '';

    const values = phones.map(p => {
      const val = p[fieldName];
      if (typeof val === 'boolean') return val ? 1 : 0;
      return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    });

    const currentVal = phone[fieldName];
    const numericVal = typeof currentVal === 'boolean' ? (currentVal ? 1 : 0) : (typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal)) || 0);

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) return 'spec-similar';

    if (invertBetter) {
      // Lower is better (e.g. price, weight)
      if (numericVal === min) return 'spec-better';
      if (numericVal === max) return 'spec-worse';
    } else {
      // Higher is better (e.g. scores, battery capacity, ram, charging)
      if (numericVal === max) return 'spec-better';
      if (numericVal === min) return 'spec-worse';
    }

    return 'spec-similar';
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left bg-background text-foreground">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary uppercase tracking-wider">
            <Scale className="h-3.5 w-3.5" /> Specs Analyzer
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Smartphone Face-Off
          </h1>
        </div>
        {phones.length > 0 && (
          <button
            onClick={() => {
              clearCompare();
              setSearchParams({});
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Comparison
          </button>
        )}
      </header>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : phones.length === 0 ? (
        /* Empty State */
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center border border-border bg-white shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 border border-border text-muted-foreground">
            <Scale className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-foreground">No Phones Selected</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add at least two smartphones to compare specifications, scores, and read AI verdicts.
          </p>
          <button
            onClick={() => handleAddSlotClick(0)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Smartphone
          </button>
        </div>
      ) : (
        /* Table Layout */
        <div className="space-y-8">
          {/* AI Recommendation Verdict Dashboard */}
          {aiVerdict && (() => {
            const paragraphs = aiVerdict.split('\n\n');
            const winnerParas = paragraphs.filter(p => p.includes('Recommended Choice') || p.includes('Winner') || p.startsWith('### Winner') || p.startsWith('### Recommended'));
            const prosConsParas = paragraphs.filter(p => p.startsWith('-') || p.toLowerCase().includes('pros') || p.toLowerCase().includes('cons'));
            const summaryParas = paragraphs.filter(p => !winnerParas.includes(p) && !prosConsParas.includes(p));

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  <h2 className="text-xl font-bold text-foreground font-sans">
                    AI Purchase Advisor Verdict
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Winner Card */}
                  <div className="md:col-span-1 rounded-3xl border-2 border-primary bg-[#FFFDF5] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-primary text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 shadow-sm">
                        <Trophy className="h-3.5 w-3.5 shrink-0" /> Winner Selection
                      </span>
                      <h3 className="text-sm font-bold text-foreground mb-2">Recommended Choice</h3>
                      <div className="text-xs text-neutral-700 leading-relaxed space-y-2">
                        {winnerParas.length > 0 ? (
                          winnerParas.map((p, idx) => (
                            <p key={idx} className="font-semibold">{p.replace(/###|####|\*\*/g, '')}</p>
                          ))
                        ) : (
                          <p className="italic text-muted-foreground">See details for recommended picks.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pros and Cons Card */}
                  <div className="md:col-span-1 rounded-3xl border border-border bg-white p-6 shadow-sm">
                    <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                      <Scale className="h-3.5 w-3.5 shrink-0 text-secondary" /> Key Factors
                    </span>
                    <h3 className="text-sm font-bold text-foreground mb-2">Pros & Cons</h3>
                    <div className="text-xs text-neutral-700 leading-relaxed space-y-3">
                      {prosConsParas.map((p, idx) => {
                        if (p.startsWith('-')) {
                          return (
                            <ul key={idx} className="list-disc pl-4 space-y-1.5">
                              {p.split('\n').map((li, i) => (
                                <li key={i}>{li.replace('- ', '').replace(/\*\*/g, '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={idx}>{p.replace(/###|####|\*\*/g, '')}</p>;
                      })}
                      {prosConsParas.length === 0 && (
                        <p className="italic text-muted-foreground">Specification breakdown below evaluates all custom advantages.</p>
                      )}
                    </div>
                  </div>

                  {/* Decision Summary Card */}
                  <div className="md:col-span-1 rounded-3xl border border-border bg-white p-6 shadow-sm">
                    <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                      <FileText className="h-3.5 w-3.5 shrink-0" /> Verdict Summary
                    </span>
                    <h3 className="text-sm font-bold text-foreground mb-2">Decision Summary</h3>
                    <div className="text-xs text-neutral-600 leading-relaxed space-y-3">
                      {summaryParas.map((p, idx) => (
                        <p key={idx}>{p.replace(/###|####|\*\*/g, '')}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Color Indicator Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-7 rounded-sm bg-[#22C55E]/10 border border-[#22C55E]/20 inline-block" /> Superior Stat</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-7 rounded-sm bg-[#9CA3AF]/10 border border-[#9CA3AF]/20 inline-block" /> Similar Stat</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-7 rounded-sm bg-[#EF4444]/10 border border-[#EF4444]/20 inline-block" /> Inferior Stat</span>
          </div>

          {/* Side-by-Side Cards Matrix */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Render selected phones */}
            {phones.map((phone) => (
              <div key={phone.id} className="glass-panel relative rounded-2xl p-4 transition-all duration-300 border border-border bg-white shadow-sm">
                {/* Delete button */}
                <button
                  onClick={() => handleRemove(phone.id)}
                  className="absolute right-3 top-3 rounded-full bg-neutral-50 border border-border p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Cover & Brand Info */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative mb-3 flex h-36 items-center justify-center p-2">
                    <img src={phone.image_url} alt={phone.model} className="h-full max-h-32 object-contain" />
                  </div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">{phone.brand_name}</span>
                  <h3 className="text-base font-extrabold text-foreground mt-0.5">{phone.model}</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">Launched: {phone.launch_date}</div>
                  <div className="mt-2 text-lg font-bold text-foreground">₹{phone.price_inr.toLocaleString()}</div>
                </div>

                <hr className="my-2.5 border-border" />

                {/* Score meters grid */}
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className={`rounded-xl p-2 text-center border border-neutral-100 shadow-sm ${getHighlightClass(phone, 'overall_score')}`}>
                    <ScoreGauge score={phone.overall_score} label="Overall" size="sm" />
                  </div>
                  <div className={`rounded-xl p-2 text-center border border-neutral-100 shadow-sm ${getHighlightClass(phone, 'performance_score')}`}>
                    <ScoreGauge score={phone.performance_score} label="Speed" size="sm" />
                  </div>
                  <div className={`rounded-xl p-2 text-center border border-neutral-100 shadow-sm ${getHighlightClass(phone, 'camera_score')}`}>
                    <ScoreGauge score={phone.camera_score} label="Camera" size="sm" />
                  </div>
                  <div className={`rounded-xl p-2 text-center border border-neutral-100 shadow-sm ${getHighlightClass(phone, 'gaming_score')}`}>
                    <ScoreGauge score={phone.gaming_score} label="Gaming" size="sm" />
                  </div>
                </div>

                <hr className="my-2.5 border-border" />

                {/* Specifications List */}
                <div className="space-y-3.5 text-xs text-foreground">
                  {/* Price */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Price</span>
                    <span className={`mt-0.5 font-bold ${getHighlightClass(phone, 'price_inr', true)}`}>
                      ₹{phone.price_inr.toLocaleString()}
                    </span>
                  </div>

                  {/* Launch Date */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Launch Date</span>
                    <span className="mt-0.5 font-bold text-foreground">
                      {phone.launch_date}
                    </span>
                  </div>

                  {/* Battery */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Battery & Charge</span>
                    <span className={`mt-0.5 font-bold ${getHighlightClass(phone, 'battery_capacity')}`}>
                      {phone.battery_capacity} mAh
                    </span>
                    <span className={`mt-0.5 text-[11px] font-semibold text-muted-foreground ${getHighlightClass(phone, 'charging_speed')}`}>
                      {phone.charging_speed}W Fast Charge
                    </span>
                  </div>

                  {/* Processor */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Processor & GPU</span>
                    <span className="mt-0.5 font-bold text-foreground line-clamp-1">{phone.processor}</span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{phone.gpu}</span>
                  </div>

                  {/* Display */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Display</span>
                    <span className="mt-0.5 font-bold text-foreground">{phone.display_size}" Display</span>
                    <span className={`mt-0.5 text-[11px] font-semibold ${getHighlightClass(phone, 'refresh_rate')}`}>
                      {phone.refresh_rate}Hz {phone.display_type}
                    </span>
                  </div>

                  {/* RAM & Storage */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Memory Specs</span>
                    <span className={`mt-0.5 font-bold ${getHighlightClass(phone, 'ram_gb')}`}>
                      {phone.ram_gb} GB RAM
                    </span>
                    <span className={`mt-0.5 text-[11px] font-semibold ${getHighlightClass(phone, 'storage_gb')}`}>
                      {phone.storage_gb} GB ROM
                    </span>
                  </div>

                  {/* Weight */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Weight & Build</span>
                    <span className={`mt-0.5 font-bold ${getHighlightClass(phone, 'weight_g', true)}`}>
                      {phone.weight_g} grams
                    </span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{phone.build_quality}</span>
                  </div>

                  {/* IP Rating */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">IP Rating</span>
                    <span className="mt-0.5 font-bold text-foreground">{phone.ip_rating} Water Resistant</span>
                  </div>

                  {/* Rear Cameras */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Cameras</span>
                    <span className="mt-0.5 font-bold text-foreground line-clamp-2">{phone.rear_camera_spec}</span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">Selfie: {phone.front_camera_spec}</span>
                  </div>

                  {/* OS */}
                  <div className="flex flex-col py-1.5 px-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">OS & Support</span>
                    <span className="mt-0.5 font-bold text-foreground">{phone.android_version}</span>
                    <span className={`mt-0.5 text-[11px] font-semibold ${getHighlightClass(phone, 'software_updates_years')}`}>
                      {phone.software_updates_years} Years OS Updates
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 4 - phones.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                onClick={() => handleAddSlotClick(phones.length + idx)}
                className="group flex h-auto min-h-[450px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100/60 hover:border-primary transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground group-hover:text-foreground group-hover:bg-neutral-200 transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="mt-4 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  Add Phone to Compare
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Phone Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl text-left">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Compare Another Phone</h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="rounded-full hover:bg-neutral-50 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search smartphone name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-neutral-50 py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground border border-border outline-none focus:border-primary focus:bg-white"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Suggestions results */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((phone) => (
                  <div
                    key={phone.id}
                    onClick={() => handleSelectPhone(phone.id)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-neutral-50 transition-colors"
                  >
                    <img src={phone.image_url} alt={phone.model} className="h-8 w-8 rounded object-cover" />
                    <div>
                      <div className="text-[10px] font-bold text-secondary">{phone.brand_name}</div>
                      <div className="text-xs font-semibold text-foreground">{phone.model}</div>
                    </div>
                    <div className="ml-auto text-xs font-mono text-muted-foreground">
                      ₹{phone.price_inr.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No phones matching "{searchQuery}" found in the catalog.
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Type at least 2 characters to search the smartphone catalog.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

