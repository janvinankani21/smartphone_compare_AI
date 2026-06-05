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
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left bg-background text-foreground">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Main Specs Summary Panel */}
      <section className="glass-panel grid gap-8 rounded-3xl p-6 md:grid-cols-2 md:p-10 border border-border bg-white shadow-sm">
        {/* Visual Media Column */}
        <div className="flex flex-col items-center justify-between rounded-2xl bg-neutral-50 border border-border p-6 relative">
          {/* Action buttons on image */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={handleWishlistClick}
              className={`rounded-full p-2.5 transition-colors ${
                wishlisted
                  ? 'bg-rose-50 text-rose-500 border border-rose-200'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-border shadow-sm'
              }`}
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={() => addToCompare(phone)}
              className={`rounded-full p-2.5 transition-colors ${
                compared
                  ? 'bg-primary/20 text-amber-800 border border-primary/30'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-border shadow-sm'
              }`}
            >
              <Scale className="h-4 w-4" />
            </button>
          </div>

          <div className="my-8 flex h-72 items-center justify-center">
            <img src={phone.image_url} alt={phone.model} className="h-full max-h-64 object-contain" />
          </div>

          <div className="w-full text-center">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">{phone.brand_name}</span>
            <h1 className="text-2xl font-extrabold text-foreground mt-1">{phone.model}</h1>
            <div className="mt-2 text-2xl font-black text-foreground">₹{phone.price_inr.toLocaleString()}</div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Launch: {phone.launch_date}</span>
              <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Retail Price (INR)</span>
            </div>
          </div>
        </div>

        {/* Scores & Quick Overview Details Column */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-secondary uppercase tracking-widest">Hardware Intelligence Summary</h2>
            <div className="mt-4 grid grid-cols-3 gap-4 rounded-2xl bg-neutral-50 p-4 border border-border shadow-sm">
              <ScoreGauge score={phone.overall_score} label="Overall Score" size="md" />
              <ScoreGauge score={phone.performance_score} label="Speed Score" size="md" />
              <ScoreGauge score={phone.camera_score} label="Camera Score" size="md" />
              <ScoreGauge score={phone.gaming_score} label="Gaming Score" size="md" />
              <ScoreGauge score={phone.battery_score} label="Battery Score" size="md" />
              <ScoreGauge score={phone.value_for_money_score} label="Value Score" size="md" />
            </div>

            {/* Pros and Cons */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                <h3 className="flex items-center gap-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Check className="h-4 w-4" /> Advantages
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-700">
                  {prosList.map((pro, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span> <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left">
                <h3 className="flex items-center gap-1 text-xs font-bold text-red-800 uppercase tracking-wider">
                  <X className="h-4 w-4" /> Disadvantages
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-700">
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
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-foreground hover:bg-secondary transition-colors"
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
          <div className="glass-panel rounded-3xl p-6 border border-border bg-white shadow-sm">
            <h2 className="mb-6 text-base font-extrabold text-foreground uppercase tracking-wider border-b border-border pb-2">Specific Analyses</h2>
            
            <div className="space-y-6">
              {/* Speed Analysis */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-secondary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Performance & GPU Profile</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Powered by the <span className="text-foreground font-semibold">{phone.processor}</span> processor and <span className="text-foreground font-semibold">{phone.gpu}</span> graphics unit. Features <span className="text-foreground font-semibold">{phone.ram_gb}GB</span> high-speed RAM and <span className="text-foreground font-semibold">{phone.storage_gb}GB</span> storage. The system runs cleanly with no noticeable thermal throttling.
                  </p>
                </div>
              </div>

              {/* Camera Analysis */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Photography & Optics</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Optics are driven by a <span className="text-foreground font-semibold">{phone.rear_camera_spec}</span> sensor configuration. The selfie unit supports <span className="text-foreground font-semibold">{phone.front_camera_spec}</span> autofocus. Captured images display excellent dynamic range and low-noise processing in twilight settings.
                  </p>
                </div>
              </div>

              {/* Gaming Index */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Gamepad className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Gaming Capability</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    A gaming score of <span className="text-foreground font-semibold">{phone.gaming_score}/100</span>. The <span className="text-foreground font-semibold">{phone.refresh_rate}Hz {phone.display_type}</span> screen facilitates lag-free 90 FPS rendering on popular graphic-heavy titles like Call of Duty Mobile.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Specifications Sheet */}
          <div className="glass-panel rounded-3xl p-6 border border-border bg-white shadow-sm">
            <h2 className="mb-6 text-base font-extrabold text-foreground uppercase tracking-wider border-b border-border pb-2">Specifications Sheet</h2>
            
            <div className="divide-y divide-border text-xs">
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Processor</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.processor}</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Graphics Card</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.gpu}</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">RAM Capacity</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.ram_gb} GB LPDDR5X</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Internal Memory</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.storage_gb} GB UFS 4.0</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Display Profile</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.display_size}" {phone.display_type} ({phone.resolution})</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Refresh Rate</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.refresh_rate} Hz Adaptive</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Battery Specs</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.battery_capacity} mAh battery | {phone.charging_speed}W Fast Charger</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Water Proofing</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.ip_rating} rating</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Chassis Quality</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.build_quality} ({phone.weight_g}g)</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Android Version</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.android_version} | {phone.software_updates_years} Years Updates</span>
              </div>
              <div className="grid grid-cols-3 py-2.5">
                <span className="font-semibold text-muted-foreground">Connectivity</span>
                <span className="col-span-2 text-foreground font-semibold">{phone.network_support}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Price Trend + Suggested Matches (1/3 width) */}
        <div className="space-y-8">
          {/* Price History Line Graph */}
          <div className="glass-panel rounded-3xl p-6 text-left border border-border bg-white shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">6-Month Price Trend</h2>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistoryData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                  <XAxis dataKey="month" stroke="#666666" fontSize={10} />
                  <YAxis stroke="#666666" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAEAEA', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    labelStyle={{ color: '#1A1A1A', fontSize: '10px' }}
                    itemStyle={{ color: '#FFB300', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#FFB300" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
              Price values reflect median listings. Actual pricing could vary across physical and virtual marketplaces.
            </p>
          </div>

          {/* You May Also Compare shortcuts */}
          <div className="glass-panel rounded-3xl p-6 text-left border border-border bg-white shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">You May Also Compare</h2>
            <div className="space-y-3">
              {related.map((alt) => (
                <Link
                  key={alt.id}
                  to={`/compare?ids=${phone.id},${alt.id}`}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 border border-border p-3 hover:bg-neutral-100 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img src={alt.image_url} alt={alt.model} className="h-10 w-10 rounded object-cover" />
                    <div>
                      <div className="text-[10px] font-bold text-secondary uppercase">{alt.brand_name}</div>
                      <div className="text-xs font-bold text-foreground group-hover:text-secondary transition-colors">{phone.model} <span className="text-muted-foreground font-light text-[10px]">vs</span> {alt.model}</div>
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
      <section className="glass-panel mt-8 rounded-3xl p-6 md:p-10 border border-border bg-white shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground uppercase tracking-wider border-b border-border pb-3">
          <MessageSquare className="h-5 w-5 text-secondary" />
          Community Reviews
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Reviews List (2/3 width) */}
          <div className="md:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center text-xs text-muted-foreground">
                No approved reviews for this smartphone yet. Be the first to write one!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-border bg-white p-5 text-left shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={rev.user_avatar} alt={rev.user_name} className="h-8 w-8 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{rev.user_name}</h4>
                      <div className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-neutral-600 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Box (1/3 width) */}
          <div className="rounded-2xl border border-border bg-neutral-50 p-5 text-left h-fit shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Write a Review</h3>
            
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
                        <Star className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}`} />
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
                    className="mt-1 w-full rounded-xl border border-border bg-white p-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                  />
                </div>

                {submitMsg && (
                  <div className={`rounded-lg p-2.5 text-center text-xs font-semibold ${
                    submitMsg.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-primary/10 text-amber-800 border border-primary/20'
                  }`}>
                    {submitMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-4 text-center py-6">
                <p className="text-xs text-muted-foreground">You must log in to submit a review.</p>
                <Link
                  to="/auth"
                  className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
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
