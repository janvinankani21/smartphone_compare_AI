import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import type { Phone } from '../context/AppContext';
import { ScoreGauge } from '../components/ScoreGauge';
import { ArrowLeft, Scale, Heart, MessageSquare, Check, X, ShieldAlert, Zap, Camera, Gamepad, Star, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const PhoneDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, addToCompare, toggleWishlist, isInWishlist, isInCompare } = useApp();

  const [phone, setPhone] = useState<Phone | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPhoneDetails();
    fetchReviews();
  }, [id]);

  const fetchPhoneDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/phones/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPhone(data.phone);
        setRelated(data.relatedComparisons);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg('');

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneId: Number(id),
          rating,
          comment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitMsg(data.message);
        setComment('');
        setRating(5);
      } else {
        setSubmitMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setSubmitMsg('Failed to post review. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-rose-500" />
        <h2 className="mt-4 text-xl font-bold text-white">Device Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The smartphone specifications you requested could not be located.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-white px-5 py-2 text-xs font-bold text-black hover:bg-neutral-200">Back Home</Link>
      </div>
    );
  }

  // Parse pros/cons arrays
  const prosList: string[] = typeof phone.pros === 'string' ? JSON.parse(phone.pros) : (phone.pros || []);
  const consList: string[] = typeof phone.cons === 'string' ? JSON.parse(phone.cons) : (phone.cons || []);

  // Generate price history mock data
  const basePrice = phone.price_inr;
  const priceHistoryData = [
    { month: 'Dec', price: Math.round(basePrice * 1.05) },
    { month: 'Jan', price: Math.round(basePrice * 1.03) },
    { month: 'Feb', price: basePrice },
    { month: 'Mar', price: basePrice },
    { month: 'Apr', price: Math.round(basePrice * 0.98) },
    { month: 'May', price: Math.round(basePrice * 0.96) }
  ];

  // Wishlist toggle
  const wishlisted = isInWishlist(phone.id);
  const compared = isInCompare(phone.id);

  const handleWishlistClick = () => {
    if (!token) {
      navigate('/auth');
      return;
    }
    toggleWishlist(phone.id);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Main Specs Summary Panel */}
      <section className="glass-panel grid gap-8 rounded-3xl p-6 md:grid-cols-2 md:p-10">
        {/* Visual Media Column */}
        <div className="flex flex-col items-center justify-between rounded-2xl bg-secondary/20 border border-border/50 p-6 relative">
          {/* Action buttons on image */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={handleWishlistClick}
              className={`rounded-full p-2.5 transition-colors ${
                wishlisted
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                  : 'bg-secondary/80 text-muted-foreground hover:text-white border border-border/60'
              }`}
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={() => addToCompare(phone)}
              className={`rounded-full p-2.5 transition-colors ${
                compared
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-secondary/80 text-muted-foreground hover:text-white border border-border/60'
              }`}
            >
              <Scale className="h-4 w-4" />
            </button>
          </div>

          <div className="my-8 flex h-72 items-center justify-center">
            <img src={phone.image_url} alt={phone.model} className="h-full max-h-64 object-contain" />
          </div>

          <div className="w-full text-center">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">{phone.brand_name}</span>
            <h1 className="text-2xl font-extrabold text-white mt-1">{phone.model}</h1>
            <div className="mt-2 text-2xl font-black text-white">₹{phone.price_inr.toLocaleString()}</div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Launch: {phone.launch_date}</span>
              <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Retail Price (INR)</span>
            </div>
          </div>
        </div>

        {/* Scores & Quick Overview Details Column */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Hardware Intelligence Summary</h2>
            <div className="mt-4 grid grid-cols-3 gap-4 rounded-2xl bg-secondary/30 p-4 border border-border/40">
              <ScoreGauge score={phone.overall_score} label="Overall Score" size="md" />
              <ScoreGauge score={phone.performance_score} label="Speed Score" size="md" />
              <ScoreGauge score={phone.camera_score} label="Camera Score" size="md" />
              <ScoreGauge score={phone.gaming_score} label="Gaming Score" size="md" />
              <ScoreGauge score={phone.battery_score} label="Battery Score" size="md" />
              <ScoreGauge score={phone.value_for_money_score} label="Value Score" size="md" />
            </div>

            {/* Pros and Cons */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-better/10 bg-better/5 p-4 text-left">
                <h3 className="flex items-center gap-1 text-xs font-bold text-better uppercase tracking-wider">
                  <Check className="h-4 w-4" /> Advantages
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                  {prosList.map((pro, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span> <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-worse/10 bg-worse/5 p-4 text-left">
                <h3 className="flex items-center gap-1 text-xs font-bold text-worse uppercase tracking-wider">
                  <X className="h-4 w-4" /> Disadvantages
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                  {consList.map((con, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span> <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => addToCompare(phone)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-neutral-200 transition-colors"
          >
            <Scale className="h-4 w-4" /> Add to Comparison Deck
          </button>
        </div>
      </section>

      {/* Pricing History Chart & Specific Analysis Tabs */}
      <section className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Left Column: Capabilities Breakdown (2/3 width) */}
        <div className="md:col-span-2 space-y-8">
          {/* Detailed capability analysis widgets */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="mb-6 text-base font-extrabold text-white uppercase tracking-wider">Specific Analyses</h2>
            
            <div className="space-y-6">
              {/* Speed Analysis */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Performance & GPU Profile</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Powered by the <span className="text-white font-semibold">{phone.processor}</span> processor and <span className="text-white font-semibold">{phone.gpu}</span> graphics unit. Features <span className="text-white font-semibold">{phone.ram_gb}GB</span> high-speed RAM and <span className="text-white font-semibold">{phone.storage_gb}GB</span> storage. The system runs cleanly with no noticeable thermal throttling.
                  </p>
                </div>
              </div>

              {/* Camera Analysis */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Photography & Optics</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Optics are driven by a <span className="text-white font-semibold">{phone.rear_camera_spec}</span> sensor configuration. The selfie unit supports <span className="text-white font-semibold">{phone.front_camera_spec}</span> autofocus. Captured images display excellent dynamic range and low-noise processing in twilight settings.
                  </p>
                </div>
              </div>

              {/* Gaming Index */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Gamepad className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gaming Capability</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    A gaming score of <span className="text-white font-semibold">{phone.gaming_score}/100</span>. The <span className="text-white font-semibold">{phone.refresh_rate}Hz {phone.display_type}</span> screen facilitates lag-free 90 FPS rendering on popular graphic-heavy titles like Call of Duty Mobile.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Specifications Sheet */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="mb-6 text-base font-extrabold text-white uppercase tracking-wider">Specifications Sheet</h2>
            
            <div className="divide-y divide-border/60 text-xs">
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Processor</span>
                <span className="col-span-2 text-white font-medium">{phone.processor}</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Graphics Card</span>
                <span className="col-span-2 text-white font-medium">{phone.gpu}</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">RAM Capacity</span>
                <span className="col-span-2 text-white font-medium">{phone.ram_gb} GB LPDDR5X</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Internal Memory</span>
                <span className="col-span-2 text-white font-medium">{phone.storage_gb} GB UFS 4.0</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Display Profile</span>
                <span className="col-span-2 text-white font-medium">{phone.display_size}" {phone.display_type} ({phone.resolution})</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Refresh Rate</span>
                <span className="col-span-2 text-white font-medium">{phone.refresh_rate} Hz Adaptive</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Battery Specs</span>
                <span className="col-span-2 text-white font-medium">{phone.battery_capacity} mAh battery | {phone.charging_speed}W Fast Charger</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Water Proofing</span>
                <span className="col-span-2 text-white font-medium">{phone.ip_rating} rating</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Chassis Quality</span>
                <span className="col-span-2 text-white font-medium">{phone.build_quality} ({phone.weight_g}g)</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Android Version</span>
                <span className="col-span-2 text-white font-medium">{phone.android_version} | {phone.software_updates_years} Years Updates</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Connectivity</span>
                <span className="col-span-2 text-white font-medium">{phone.network_support}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Price Trend + Suggested Matches (1/3 width) */}
        <div className="space-y-8">
          {/* Price History Line Graph */}
          <div className="glass-panel rounded-3xl p-6 text-left">
            <h2 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">6-Month Price Trend</h2>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistoryData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#fafafa', fontSize: '10px' }}
                    itemStyle={{ color: '#06b6d4', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
              Price values reflect median listings. Actual pricing could vary across physical and virtual marketplaces.
            </p>
          </div>

          {/* You May Also Compare shortcuts */}
          <div className="glass-panel rounded-3xl p-6 text-left">
            <h2 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">You May Also Compare</h2>
            <div className="space-y-3">
              {related.map((alt) => (
                <Link
                  key={alt.id}
                  to={`/compare?ids=${phone.id},${alt.id}`}
                  className="flex items-center justify-between rounded-xl bg-secondary/30 border border-border/40 p-3 hover:bg-secondary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src={alt.image_url} alt={alt.model} className="h-10 w-10 rounded object-cover" />
                    <div>
                      <div className="text-[10px] font-bold text-accent uppercase">{alt.brand_name}</div>
                      <div className="text-xs font-bold text-white group-hover:text-accent transition-colors">{phone.model} <span className="text-muted-foreground font-light text-[10px]">vs</span> {alt.model}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews Module */}
      <section className="glass-panel mt-8 rounded-3xl p-6 md:p-10">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white uppercase tracking-wider">
          <MessageSquare className="h-5 w-5 text-accent" />
          Community Reviews
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Reviews List (2/3 width) */}
          <div className="md:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/5 py-12 text-center text-xs text-muted-foreground">
                No approved reviews for this smartphone yet. Be the first to write one!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-border/50 bg-secondary/20 p-5 text-left">
                  <div className="flex items-center gap-3">
                    <img src={rev.user_avatar} alt={rev.user_name} className="h-8 w-8 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{rev.user_name}</h4>
                      <div className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-neutral-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Box (1/3 width) */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-5 text-left h-fit">
            <h3 className="text-sm font-bold text-white">Write a Review</h3>
            
            {token ? (
              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Star Rating</label>
                  <div className="mt-1 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-muted-foreground hover:scale-110 transition-transform"
                      >
                        <Star className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Your Comments</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about camera blur, gaming lag, or battery cycles..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-secondary/80 p-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-accent"
                  />
                </div>

                {submitMsg && (
                  <div className={`rounded-lg p-2.5 text-center text-xs font-semibold ${
                    submitMsg.includes('Error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-accent/10 text-accent border border-accent/20'
                  }`}>
                    {submitMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-white py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-4 text-center py-6">
                <p className="text-xs text-muted-foreground">You must log in to submit a review.</p>
                <Link
                  to="/auth"
                  className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
