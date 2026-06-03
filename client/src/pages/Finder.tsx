import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { Sparkles, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';

export const Finder: React.FC = () => {
  const { addToCompare, isInCompare } = useApp();

  const [budget, setBudget] = useState('under30k');
  const [usages, setUsages] = useState<string[]>(['Gaming']);
  
  const [recommendations, setRecommendations] = useState<Phone[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const budgetOptions = [
    { value: 'under10k', label: 'Under ₹10,000', desc: 'Entry-level budget' },
    { value: 'under15k', label: 'Under ₹15,000', desc: 'Affordable performance' },
    { value: 'under20k', label: 'Under ₹20,000', desc: 'Midrange value' },
    { value: 'under30k', label: 'Under ₹30,000', desc: 'Flagship killers' },
    { value: 'premium', label: 'Premium Segment', desc: 'Elite flagships (No limit)' }
  ];

  const usageOptions = [
    { value: 'Gaming', desc: 'Heavy graphic games, high framerates (prioritizes CPU & GPU)' },
    { value: 'Photography', desc: 'Portrait lenses, detailed zoom, optical stability (OIS)' },
    { value: 'Video Editing', desc: 'Rendering clips, capturing 4K files, fast background exports' },
    { value: 'Student', desc: 'Social scrolling, PDF lecture sheets, robust daily battery' },
    { value: 'Office Use', desc: 'Slack notifications, emails, calls, high screen brightness' },
    { value: 'Content Creation', desc: 'Front selfie cameras, dual mic inputs, creator filters' }
  ];

  const handleToggleUsage = (value: string) => {
    if (usages.includes(value)) {
      if (usages.length > 1) {
        setUsages(usages.filter(u => u !== value));
      }
    } else {
      setUsages([...usages, value]);
    }
  };

  const handleFind = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/phones/finder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ budget, usages })
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
        setReasoning(data.reasoning);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBudget('under30k');
    setUsages(['Gaming']);
    setRecommendations([]);
    setReasoning('');
    setSearched(false);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left">
      {/* Header */}
      <header className="mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Matchmaker Wizard
        </span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white font-sans">
          Best Phone Finder
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us your budget segment and primary phone activities. Our expert AI system evaluates hardware components to select the best match.
        </p>
      </header>

      {!searched ? (
        /* Setup Form Wizard */
        <div className="grid gap-8 md:grid-cols-3">
          {/* Step 1: Budget */}
          <div className="glass-panel flex flex-col justify-between rounded-3xl p-6">
            <div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/25 text-xs font-bold text-accent">01</div>
              <h2 className="mt-4 text-base font-extrabold text-white">Select Budget Segment</h2>
              <div className="mt-6 space-y-3">
                {budgetOptions.map((opt) => (
                  <label
                    key={opt.value}
                    onClick={() => setBudget(opt.value)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                      budget === opt.value
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      checked={budget === opt.value}
                      readOnly
                      className="mt-1 accent-accent"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Use Cases */}
          <div className="glass-panel md:col-span-2 flex flex-col justify-between rounded-3xl p-6">
            <div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400/25 text-xs font-bold text-yellow-400">02</div>
              <h2 className="mt-4 text-base font-extrabold text-white">What will you use the phone for?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {usageOptions.map((opt) => {
                  const selected = usages.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleToggleUsage(opt.value)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                        selected
                          ? 'border-yellow-400 bg-yellow-400/5'
                          : 'border-border bg-secondary/20 hover:bg-secondary/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="mt-1 accent-yellow-400"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{opt.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleFind}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-neutral-200 transition-colors"
            >
              Find My Best Smartphone Match <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-8">
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-xs font-bold text-white hover:bg-secondary transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Start Search Again
            </button>
          </div>

          {loading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <p className="text-xs text-muted-foreground animate-pulse">Running AI spec analysis engine...</p>
            </div>
          ) : recommendations.length === 0 ? (
            /* Empty matches */
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
              <ShieldAlert className="h-12 w-12 text-rose-500" />
              <h2 className="mt-4 text-lg font-bold text-white">No Phones Found</h2>
              <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
                We couldn't find any phones directly matching your parameters. This could happen if the budget threshold is too low for the selected activities (e.g. video editing under 10k).
              </p>
            </div>
          ) : (
            /* Recommendations list */
            <div className="grid gap-8 md:grid-cols-3">
              {/* Recommendations grid column (2/3 width) */}
              <div className="md:col-span-2 space-y-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Top 3 Recommended Matches</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {recommendations.map((phone, idx) => {
                    const compared = isInCompare(phone.id);
                    // Match score is overall_score or dynamically appended matchScore
                    const matchPercent = (phone as any).matchScore || phone.overall_score;

                    return (
                      <div key={phone.id} className="glass-card group flex flex-col justify-between rounded-2xl p-5 text-left relative overflow-hidden">
                        {/* Match ribbon */}
                        <div className="absolute left-0 top-0 rounded-br-xl bg-accent px-3 py-1 text-[9px] font-bold text-black uppercase">
                          Pick #{idx + 1}
                        </div>

                        <div className="flex flex-col items-center py-4">
                          <div className="relative mb-3 flex h-36 items-center justify-center p-2 transition-transform group-hover:scale-[1.02]">
                            <img src={phone.image_url} alt={phone.model} className="h-full max-h-32 object-contain" />
                          </div>
                          
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-wide">{phone.brand_name}</span>
                            <h3 className="text-base font-extrabold text-white mt-0.5">{phone.model}</h3>
                            <div className="mt-2 text-base font-black text-white">₹{phone.price_inr.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Spec scores */}
                        <div className="grid grid-cols-2 gap-3 py-3 border-t border-border/50 text-xs">
                          <div className="flex justify-between border-r border-border/30 pr-2">
                            <span className="text-muted-foreground">Match Rating:</span>
                            <span className="font-bold text-accent">{matchPercent}%</span>
                          </div>
                          <div className="flex justify-between pl-2">
                            <span className="text-muted-foreground">Speed Index:</span>
                            <span className="font-bold text-white">{phone.performance_score}</span>
                          </div>
                          <div className="flex justify-between border-r border-border/30 pr-2">
                            <span className="text-muted-foreground">Camera Spec:</span>
                            <span className="font-bold text-white">{phone.camera_score}</span>
                          </div>
                          <div className="flex justify-between pl-2">
                            <span className="text-muted-foreground">Battery Spec:</span>
                            <span className="font-bold text-white">{phone.battery_score}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link
                            to={`/phone/${phone.id}`}
                            className="flex-1 rounded-lg border border-border bg-secondary/30 py-2 text-center text-xs font-bold text-white hover:bg-secondary"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => addToCompare(phone)}
                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                              compared
                                ? 'bg-accent/20 text-accent border border-accent/40'
                                : 'bg-white text-black hover:bg-neutral-200'
                            }`}
                          >
                            {compared ? 'In Bucket' : 'Add to Compare'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Reasoning summary column (1/3 width) */}
              <div className="glass-panel rounded-3xl p-6 self-start">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-accent uppercase tracking-wider mb-4">
                  <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                  AI Recommendation Detail
                </h2>
                
                <div className="prose prose-invert text-xs text-neutral-300 leading-relaxed space-y-4">
                  {reasoning.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('###')) {
                      return <h3 key={index} className="text-sm font-extrabold text-white pt-2">{paragraph.replace('###', '')}</h3>;
                    }
                    if (paragraph.startsWith('####')) {
                      return <h4 key={index} className="text-xs font-bold text-white pt-1">{paragraph.replace('####', '')}</h4>;
                    }
                    if (paragraph.startsWith('-')) {
                      return (
                        <ul key={index} className="list-disc pl-4 space-y-1">
                          {paragraph.split('\n').map((li, i) => (
                            <li key={i}>{li.replace('- ', '').replace(/\*\*/g, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={index}>{paragraph}</p>;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
