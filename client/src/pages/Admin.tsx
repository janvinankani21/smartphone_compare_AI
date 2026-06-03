import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import { LayoutDashboard, MessageSquarePlus, Smartphone, BarChart3, Check, X, Trash2, Plus, UserCheck, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const Admin: React.FC = () => {
  const { user, token } = useApp();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'reviews' | 'phones'>('analytics');

  // API States
  const [stats, setStats] = useState<any>(null);
  const [mostCompared, setMostCompared] = useState<any[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [allPhones, setAllPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Phone Form state
  const [brandId, setBrandId] = useState('2'); // Default Samsung
  const [model, setModel] = useState('');
  const [launchDate, setLaunchDate] = useState('2024-01-01');
  const [price, setPrice] = useState('');
  const [processor, setProcessor] = useState('');
  const [gpu, setGpu] = useState('');
  const [ram, setRam] = useState('8');
  const [storage, setStorage] = useState('128');
  const [displaySize, setDisplaySize] = useState('6.7');
  const [displayType, setDisplayType] = useState('AMOLED');
  const [refreshRate, setRefreshRate] = useState('120');
  const [battery, setBattery] = useState('5000');
  const [charging, setCharging] = useState('45');
  const [rearCamera, setRearCamera] = useState('50MP Main (OIS) + 8MP Ultra-wide');
  
  // Static spec defaults for form payload
  const frontCamera = '16MP';
  const updates = '3';
  const weight = '190';
  const ipRating = 'IP68';
  const osVersion = 'Android 14';
  const buildQuality = 'Glass front, Aluminum frame';
  
  const [formMsg, setFormMsg] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (!token || !user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAnalytics();
    fetchPendingReviews();
    fetchAllPhones();
  }, [token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setMostCompared(data.mostCompared);
        setMonthlyGrowth(data.monthlyGrowth);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllPhones = async () => {
    try {
      const res = await fetch(`${API_URL}/phones`);
      if (res.ok) {
        const data = await res.json();
        setAllPhones(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveReview = async (reviewId: number, isApproved: boolean) => {
    try {
      const res = await fetch(`${API_URL}/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_approved: isApproved })
      });
      if (res.ok) {
        setPendingReviews(pendingReviews.map(r => r.id === reviewId ? { ...r, is_approved: isApproved ? 1 : 0 } : r));
        fetchAnalytics(); // Refresh pending reviews count
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Delete this review forever?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingReviews(pendingReviews.filter(r => r.id !== reviewId));
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhone = async (phoneId: number) => {
    if (!window.confirm('Delete this smartphone from the catalog permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/phones/${phoneId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAllPhones(allPhones.filter(p => p.id !== phoneId));
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormSuccess(false);

    const payload = {
      brand_id: Number(brandId),
      model,
      launch_date: launchDate,
      price_inr: Number(price),
      processor,
      gpu,
      ram_gb: Number(ram),
      storage_gb: Number(storage),
      display_size: Number(displaySize),
      display_type: displayType,
      refresh_rate: Number(refreshRate),
      battery_capacity: Number(battery),
      charging_speed: Number(charging),
      rear_camera_spec: rearCamera,
      front_camera_spec: frontCamera,
      software_updates_years: Number(updates),
      weight_g: Number(weight),
      ip_rating: ipRating,
      android_version: osVersion,
      build_quality: buildQuality
    };

    try {
      const res = await fetch(`${API_URL}/admin/phones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(true);
        setFormMsg(data.message);
        // Clear fields
        setModel('');
        setPrice('');
        setLaunchDate('2024-01-01');
        setProcessor('');
        setGpu('');
        fetchAllPhones();
        fetchAnalytics();
      } else {
        setFormMsg(data.error || 'Failed to insert smartphone');
      }
    } catch (err) {
      setFormMsg('Server connection issue occurred');
    }
  };


  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8 text-left">
      {/* Head */}
      <header className="mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent uppercase tracking-wider">
          <LayoutDashboard className="h-3.5 w-3.5" /> Portal Space
        </span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white font-sans">
          Admin Dashboard
        </h1>
      </header>

      {/* Tabs list */}
      <div className="mb-8 flex border-b border-border text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'analytics' ? 'border-accent text-white' : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Performance Stats
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-1.5 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'reviews' ? 'border-accent text-white' : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <MessageSquarePlus className="h-4 w-4" /> Reviews Moderation
          {stats?.pendingReviews > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] text-white font-mono animate-bounce">{stats.pendingReviews}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('phones')}
          className={`flex items-center gap-1.5 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'phones' ? 'border-accent text-white' : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <Smartphone className="h-4 w-4" /> Manage Catalog
        </button>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-8">
              {/* Stat boxes widgets */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="glass-panel rounded-2xl p-6">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Registered Users</div>
                  <div className="mt-2 text-3xl font-black text-white">{stats.totalUsers}</div>
                  <p className="mt-1 text-[10px] text-better font-semibold flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Standard Roles</p>
                </div>
                <div className="glass-panel rounded-2xl p-6">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Devices Catalog</div>
                  <div className="mt-2 text-3xl font-black text-white">{stats.totalPhones}</div>
                  <p className="mt-1 text-[10px] text-accent font-semibold flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Seeding models loaded</p>
                </div>
                <div className="glass-panel rounded-2xl p-6">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Pending Approvals</div>
                  <div className="mt-2 text-3xl font-black text-white">{stats.pendingReviews}</div>
                  <p className={`mt-1 text-[10px] font-semibold ${stats.pendingReviews > 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                    {stats.pendingReviews > 0 ? 'Action required in moderation queue' : 'Clear review queues'}
                  </p>
                </div>
              </div>

              {/* Graphical Charts Section */}
              <div className="grid gap-8 md:grid-cols-2">
                {/* Traffic Activity area chart */}
                <div className="glass-panel rounded-3xl p-6">
                  <h3 className="mb-4 text-xs font-extrabold text-white uppercase tracking-wider">6-Month Traffic Analysis</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorComparisons" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                        <YAxis stroke="#71717a" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend fontSize={10} wrapperStyle={{ paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="views" name="Page Views" stroke="#06b6d4" fillOpacity={1} fill="url(#colorComparisons)" />
                        <Area type="monotone" dataKey="searches" name="Searches Logged" stroke="#a855f7" fillOpacity={1} fill="url(#colorSearches)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Most viewed phone models bar chart */}
                <div className="glass-panel rounded-3xl p-6">
                  <h3 className="mb-4 text-xs font-extrabold text-white uppercase tracking-wider">Top 5 Most Viewed Models</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mostCompared} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="model" stroke="#71717a" fontSize={9} tickFormatter={(v) => v.split(' ')[0]} />
                        <YAxis stroke="#71717a" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="views_count" name="View Count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="mb-6 text-sm font-extrabold text-white uppercase tracking-wider">Comments Moderation List</h2>
              
              {pendingReviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                  No review feedback logged on the platform yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                      <tr>
                        <th className="pb-3 pr-2">Device</th>
                        <th className="pb-3 px-2">User Email</th>
                        <th className="pb-3 px-2">Rating</th>
                        <th className="pb-3 px-2 w-[40%]">Comment</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 pl-2 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {pendingReviews.map((rev) => (
                        <tr key={rev.id} className="hover:bg-secondary/15 transition-colors">
                          <td className="py-4 pr-2 font-bold text-white">{rev.phone_model}</td>
                          <td className="py-4 px-2 text-muted-foreground">{rev.user_email}</td>
                          <td className="py-4 px-2">
                            <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                              {rev.rating} ★
                            </span>
                          </td>
                          <td className="py-4 px-2 text-neutral-300 leading-normal max-w-sm truncate">{rev.comment}</td>
                          <td className="py-4 px-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                              rev.is_approved === 1 || rev.is_approved === true
                                ? 'bg-better/10 text-better'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {rev.is_approved === 1 || rev.is_approved === true ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 pl-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              {!(rev.is_approved === 1 || rev.is_approved === true) ? (
                                <button
                                  onClick={() => handleApproveReview(rev.id, true)}
                                  className="rounded p-1 bg-better/15 text-better hover:bg-better/25 transition-colors"
                                  title="Approve Review"
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveReview(rev.id, false)}
                                  className="rounded p-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
                                  title="Revoke Approval"
                                >
                                  <X className="h-4.5 w-4.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="rounded p-1 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
                                title="Delete review entry"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE PHONES */}
          {activeTab === 'phones' && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column: Form to create device (2/3 width) */}
              <div className="glass-panel rounded-3xl p-6 lg:col-span-2 text-left">
                <h3 className="mb-6 flex items-center gap-1 text-sm font-extrabold text-white uppercase tracking-wider">
                  <Plus className="h-4.5 w-4.5" /> Add Smartphone Model
                </h3>

                {formMsg && (
                  <div className={`mb-6 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                    formSuccess ? 'bg-better/15 text-better' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    <ShieldAlert className="h-4.5 w-4.5" />
                    <span>{formMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAddPhoneSubmit} className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Brand Selector</label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    >
                      <option value="1">Apple</option>
                      <option value="2">Samsung</option>
                      <option value="3">OnePlus</option>
                      <option value="4">Google</option>
                      <option value="5">Nothing</option>
                      <option value="6">Xiaomi</option>
                      <option value="7">Oppo</option>
                      <option value="8">Vivo</option>
                      <option value="9">Motorola</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Model Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Galaxy S24 Ultra"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Launch Date</label>
                    <input
                      type="date"
                      required
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Price in INR (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 129999"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Processor Brand & Spec</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Snapdragon 8 Gen 3"
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">GPU Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Adreno 750"
                      value={gpu}
                      onChange={(e) => setGpu(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">RAM Size (GB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Storage ROM Size (GB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 256"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Size (inches)</label>
                    <input
                      type="text"
                      placeholder="e.g. 6.8"
                      value={displaySize}
                      onChange={(e) => setDisplaySize(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Type & Refresh Rate</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="e.g. LTPO AMOLED"
                        value={displayType}
                        onChange={(e) => setDisplayType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                      />
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        value={refreshRate}
                        onChange={(e) => setRefreshRate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Battery & Charging Watts</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={battery}
                        onChange={(e) => setBattery(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                      />
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={charging}
                        onChange={(e) => setCharging(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Rear Cameras Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. 50MP Main (OIS) + 12MP Ultra-wide"
                      value={rearCamera}
                      onChange={(e) => setRearCamera(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-secondary/40 p-2 text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-accent py-3 text-xs font-bold text-black hover:bg-cyan-400 transition-colors mt-2"
                    >
                      Insert Smartphone Specification Record
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Mini List to edit/delete phones (1/3 width) */}
              <div className="glass-panel rounded-3xl p-6 text-left h-[500px] flex flex-col justify-between">
                <div>
                  <h3 className="mb-4 text-xs font-extrabold text-white uppercase tracking-wider">Device Directory</h3>
                  <div className="overflow-y-auto max-h-[380px] space-y-2">
                    {allPhones.map((phone) => (
                      <div
                        key={phone.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/20 border border-border/40 p-2.5 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img src={phone.image_url} alt={phone.model} className="h-8 w-8 rounded object-cover" />
                          <div className="text-[11px]">
                            <div className="font-bold text-white truncate max-w-[120px]">{phone.model}</div>
                            <div className="text-muted-foreground font-mono">₹{phone.price_inr.toLocaleString()}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePhone(phone.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                          title="Delete device"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
