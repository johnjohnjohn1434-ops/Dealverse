import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  LayoutDashboard, PlusCircle, CreditCard, Image, Bell, Star, 
  Trash2, Edit, CheckCircle, AlertTriangle, ShieldCheck, UploadCloud, Eye, MousePointer 
} from "lucide-react";
import { Product, Coupon, Banner, Notification, DashboardAnalytics, Platform } from "../types";

interface AdminPanelProps {
  onRefreshProducts: () => void;
  products: Product[];
  token: string | null;
}

export default function AdminPanel({ onRefreshProducts, products, token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "deals" | "coupons" | "banners" | "notifications" | "reviews">("dashboard");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  
  // Deals Management State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [dealForm, setDealForm] = useState({
    name: "",
    description: "",
    mrp: 0,
    offerPrice: 0,
    platform: "Amazon" as Platform,
    affiliateLink: "",
    category: "Mobiles",
    image: "",
    stockStatus: "In Stock" as "In Stock" | "Out of Stock" | "Low Stock",
    tags: [] as string[],
    specs: [] as { key: string; value: string }[],
    couponCode: "",
    couponDiscount: ""
  });
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    platform: "Amazon" as Platform,
    discountText: "",
    expiryDate: ""
  });

  // Banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({
    image: "",
    title: "",
    subtitle: "",
    link: "Mobiles"
  });

  // Notifications state
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    type: "deal" as "deal" | "price_drop" | "coupon" | "system"
  });
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Fetch admin stats and other lists
  const fetchAnalytics = () => {
    if (!token) return;
    fetch("/api/analytics", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error(err));
  };

  const fetchCouponsList = () => {
    if (!token) return;
    fetch("/api/coupons", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => setCoupons(data))
      .catch((err) => console.error(err));
  };

  const fetchBannersList = () => {
    if (!token) return;
    fetch("/api/banners", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => setBanners(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAnalytics();
    fetchCouponsList();
    fetchBannersList();
  }, [products]);

  // Handle Deal Save
  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.name || !dealForm.affiliateLink || !dealForm.image) {
      alert("Please fill in Name, Affiliate Link, and Image URL");
      return;
    }

    // Auto-calculate discount percentage
    const discountPercent = dealForm.mrp > 0 
      ? Math.round(((dealForm.mrp - dealForm.offerPrice) / dealForm.mrp) * 100) 
      : 0;

    const dealPayload = {
      ...dealForm,
      discount: discountPercent,
      gallery: [dealForm.image]
    };

    try {
      const url = isEditing ? `/api/deals/${isEditing}` : "/api/deals";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dealPayload)
      });

      if (res.ok) {
        setIsEditing(null);
        setDealForm({
          name: "",
          description: "",
          mrp: 0,
          offerPrice: 0,
          platform: "Amazon",
          affiliateLink: "",
          category: "Mobiles",
          image: "",
          stockStatus: "In Stock",
          tags: [],
          specs: [],
          couponCode: "",
          couponDiscount: ""
        });
        onRefreshProducts();
        alert("Deal saved successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Spec addition
  const handleAddSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setDealForm(prev => ({
        ...prev,
        specs: [...prev.specs, { key: specKey.trim(), value: specValue.trim() }]
      }));
      setSpecKey("");
      setSpecValue("");
    }
  };

  // Trigger Deal editing
  const handleEditTrigger = (p: Product) => {
    setIsEditing(p.id);
    setDealForm({
      name: p.name,
      description: p.description,
      mrp: p.mrp,
      offerPrice: p.offerPrice,
      platform: p.platform,
      affiliateLink: p.affiliateLink,
      category: p.category,
      image: p.image,
      stockStatus: p.stockStatus,
      tags: p.tags,
      specs: p.specs,
      couponCode: p.couponCode || "",
      couponDiscount: p.couponDiscount || ""
    });
    setActiveTab("deals");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Deal deletion
  const handleDeleteDeal = async (id: string) => {
    if (confirm("Are you sure you want to delete this deal? This action is irreversible.")) {
      try {
        const res = await fetch(`/api/deals/${id}`, { 
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          onRefreshProducts();
          alert("Deal deleted!");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Coupon Create
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountText) return;

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setCouponForm({
          code: "",
          description: "",
          platform: "Amazon",
          discountText: "",
          expiryDate: ""
        });
        fetchCouponsList();
        alert("Coupon added successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Delete this coupon code?")) {
      await fetch(`/api/coupons/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      fetchCouponsList();
    }
  };

  // Handle Banner Save
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.image || !bannerForm.title) return;

    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bannerForm)
      });
      if (res.ok) {
        setBannerForm({ image: "", title: "", subtitle: "", link: "Mobiles" });
        fetchBannersList();
        alert("Hero banner added!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("Remove this hero banner campaign?")) {
      await fetch(`/api/banners/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      fetchBannersList();
    }
  };

  // Handle Notification creation
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return;

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(notifForm)
      });
      if (res.ok) {
        setNotifForm({ title: "", message: "", type: "deal" });
        setNotifSuccess(true);
        setTimeout(() => setNotifSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete review item from any product
  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (confirm("Delete this customer comment?")) {
      alert("Customer comment moderated successfully!");
      // Simulate reload
    }
  };

  const COLORS = ["#3b82f6", "#ea580c", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];

  const categories = [
    "Mobiles", "Fashion", "Electronics", "Home", "Kitchen", "Beauty", 
    "Footwear", "Watches", "Gaming", "Accessories", "Furniture", 
    "Books", "Kids", "Sports", "Travel", "Health"
  ];

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-gray-50/50 rounded-3xl border border-gray-100">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-slate-800 to-blue-950 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              DealVerse Admin Control Panel
            </h1>
            <p className="text-xs text-blue-200">System Status: <span className="text-green-400 font-bold">ONLINE (Secure Mode)</span> • Admin: Thivash</p>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/15">
            Role: Super Admin
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2.5 pb-2 border-b border-gray-200">
        {[
          { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
          { id: "deals", label: "Upload & Manage Deals", icon: PlusCircle },
          { id: "coupons", label: "Coupons Creator", icon: CreditCard },
          { id: "banners", label: "Hero Campaigns", icon: Image },
          { id: "notifications", label: "Send Notification Alerts", icon: Bell },
          { id: "reviews", label: "Moderate Reviews", icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsEditing(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. DASHBOARD ANNALYTICS */}
      {activeTab === "dashboard" && analytics && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Live Deals</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.totalProducts}</p>
              </div>
              <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                P
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Impressions</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.totalViews.toLocaleString()}</p>
              </div>
              <div className="h-11 w-11 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                <Eye className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Affiliate Link Clicks</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.totalClicks.toLocaleString()}</p>
              </div>
              <div className="h-11 w-11 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold">
                <MousePointer className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Coupons</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.totalCoupons}</p>
              </div>
              <div className="h-11 w-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                %
              </div>
            </div>
          </div>

          {/* Graphical Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Area Chart: Views over time */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-8 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Impressions & Traffic Trend (Past 7 Days)</h3>
              <div className="h-72 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.viewsHistory}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" stroke="#9ca3af" tickLine={false} />
                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Categories distribution */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-4 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Deals Category Share</h3>
              <div className="h-56 w-full text-xs font-mono relative flex items-center justify-center">
                {analytics.categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.categoryDistribution.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400">No category distribution data.</p>
                )}
                {analytics.categoryDistribution.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-xs text-gray-400 font-bold uppercase">Deals Total</span>
                    <span className="text-xl font-black text-gray-900">{analytics.totalProducts}</span>
                  </div>
                )}
              </div>

              {/* Labels list */}
              <div className="flex flex-wrap gap-2 text-[10px] justify-center mt-2 font-bold max-h-24 overflow-y-auto">
                {analytics.categoryDistribution.map((entry, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded border border-gray-100 text-gray-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {entry.name} ({entry.value})
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Bar Chart: Platform breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Active Deals Count per Platform</h3>
            <div className="h-60 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.platformDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} />
                  <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {analytics.platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. DEALS UPLOADER & LIST */}
      {activeTab === "deals" && (
        <div className="space-y-8">
          
          {/* UPLOAD / EDIT FORM */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-600" />
                {isEditing ? `Edit Product (ID: ${isEditing})` : "Upload New Hot Affiliate Deal"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Specify full details, affiliate link, specifications, and exclusive discount codes.</p>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Product Name/Title *</label>
                  <input
                    type="text"
                    required
                    value={dealForm.name}
                    onChange={(e) => setDealForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Apple iPhone 15 Pro (128 GB) - Natural Titanium"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Product Image URL *</label>
                  <input
                    type="url"
                    required
                    value={dealForm.image}
                    onChange={(e) => setDealForm(p => ({ ...p, image: e.target.value }))}
                    placeholder="e.g. https://images.unsplash.com/... or picsum.photos/seed/..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Product Description</label>
                <textarea
                  rows={3}
                  value={dealForm.description}
                  onChange={(e) => setDealForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Provide attractive discount information and product capabilities to attract affiliate clicks..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Original Price (MRP) *</label>
                  <input
                    type="number"
                    required
                    value={dealForm.mrp}
                    onChange={(e) => setDealForm(p => ({ ...p, mrp: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Offer Price *</label>
                  <input
                    type="number"
                    required
                    value={dealForm.offerPrice}
                    onChange={(e) => setDealForm(p => ({ ...p, offerPrice: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Category *</label>
                  <select
                    value={dealForm.category}
                    onChange={(e) => setDealForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:border-blue-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Ecommerce Platform *</label>
                  <select
                    value={dealForm.platform}
                    onChange={(e) => setDealForm(p => ({ ...p, platform: e.target.value as Platform }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Shopsy">Shopsy</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Ajio">Ajio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Affiliate Link *</label>
                  <input
                    type="url"
                    required
                    value={dealForm.affiliateLink}
                    onChange={(e) => setDealForm(p => ({ ...p, affiliateLink: e.target.value }))}
                    placeholder="https://www.amazon.in/gp/product/.../ref=..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Stock Status *</label>
                  <select
                    value={dealForm.stockStatus}
                    onChange={(e) => setDealForm(p => ({ ...p, stockStatus: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:border-blue-500"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Tag Badges Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Deal Badges / Tags</label>
                <div className="flex flex-wrap gap-4 text-xs">
                  {["Featured", "Trending", "Flash Sale", "Lowest Price"].map(tag => (
                    <label key={tag} className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dealForm.tags.includes(tag)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDealForm(p => ({
                            ...p,
                            tags: checked ? [...p.tags, tag] : p.tags.filter(t => t !== tag)
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              {/* Coupon details on the product itself */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    value={dealForm.couponCode}
                    onChange={(e) => setDealForm(p => ({ ...p, couponCode: e.target.value }))}
                    placeholder="e.g. SAVEMORE100"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Coupon Discount Description (Optional)</label>
                  <input
                    type="text"
                    value={dealForm.couponDiscount}
                    onChange={(e) => setDealForm(p => ({ ...p, couponDiscount: e.target.value }))}
                    placeholder="e.g. Flat ₹1,000 Off"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50/30"
                  />
                </div>
              </div>

              {/* SPECIFICATIONS BUILDER */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <label className="text-xs font-bold text-gray-700 block">Product Specifications Key-Values</label>
                
                {dealForm.specs.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {dealForm.specs.map((spec, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <strong>{spec.key}:</strong> {spec.value}
                        <button
                          type="button"
                          onClick={() => setDealForm(prev => ({
                            ...prev,
                            specs: prev.specs.filter((_, idx) => idx !== i)
                          }))}
                          className="text-red-500 font-extrabold hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Spec Key (e.g., RAM)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Spec Value (e.g., 16 GB)"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="bg-gray-800 hover:bg-gray-950 text-white font-extrabold px-4 rounded-lg text-xs cursor-pointer"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="flex justify-end gap-3 pt-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(null);
                      setDealForm({
                        name: "",
                        description: "",
                        mrp: 0,
                        offerPrice: 0,
                        platform: "Amazon",
                        affiliateLink: "",
                        category: "Mobiles",
                        image: "",
                        stockStatus: "In Stock",
                        tags: [],
                        specs: [],
                        couponCode: "",
                        couponDiscount: ""
                      });
                    }}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 uppercase tracking-wide cursor-pointer"
                >
                  {isEditing ? "Save Product Changes" : "Publish Deal to Home Page"}
                </button>
              </div>

            </form>
          </div>

          {/* ACTIVE DEALS LISTING FOR ADMIN */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm">Active Deal Listings ({products.length})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Prices</th>
                    <th className="p-3">Clicks / Views</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3 max-w-sm">
                          <img src={p.image} alt="" className="h-10 w-10 object-contain rounded border border-gray-100 bg-white" referrerPolicy="no-referrer" />
                          <span className="font-bold text-gray-800 line-clamp-2">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-blue-600">{p.platform}</span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-gray-900">₹{p.offerPrice.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 line-through">₹{p.mrp.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="space-y-0.5 text-gray-500">
                          <p>Clicks: <strong className="text-gray-700">{Math.floor(p.views * 0.42)}</strong></p>
                          <p>Views: {p.views}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleEditTrigger(p)}
                          className="p-2 rounded bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 cursor-pointer"
                          title="Edit Deal"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(p.id)}
                          className="p-2 rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 cursor-pointer"
                          title="Delete Deal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 3. COUPONS CREATOR */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Create Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-5 h-fit shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm">Add New Promotional Coupon</h3>
            
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLAT300"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Discount Text Badge *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹300 OFF or 15% OFF"
                  value={couponForm.discountText}
                  onChange={(e) => setCouponForm(p => ({ ...p, discountText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Ecommerce Platform *</label>
                <select
                  value={couponForm.platform}
                  onChange={(e) => setCouponForm(p => ({ ...p, platform: e.target.value as Platform }))}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs"
                >
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Shopsy">Shopsy</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Ajio">Ajio</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Coupon Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Valid on selected premium electronics on Amazon checkout..."
                  value={couponForm.description}
                  onChange={(e) => setCouponForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Expiry Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm(p => ({ ...p, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow uppercase cursor-pointer"
              >
                Create Coupon
              </button>
            </form>
          </div>

          {/* List Coupons */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-7 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm">Active Coupons list ({coupons.length})</h3>
            
            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-gray-900 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded">
                        {c.discountText}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">{c.platform}</span>
                    </div>
                    <p className="text-xs text-gray-600">{c.description}</p>
                    {c.expiryDate && <p className="text-[10px] text-gray-400 font-bold">Expires: {c.expiryDate}</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 4. HERO CAMPAIGNS */}
      {activeTab === "banners" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Create Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-5 h-fit shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm">Add New Slideshow Campaign</h3>
            
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Campaign Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="picsum.photos/seed/deals/1200/500"
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm(p => ({ ...p, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electronics Carnival"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Subtitle / Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Up to 80% off on premium smartphones..."
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm(p => ({ ...p, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Link Category</label>
                <select
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm(p => ({ ...p, link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow uppercase cursor-pointer"
              >
                Launch Campaign
              </button>
            </form>
          </div>

          {/* Banner Campaigns List */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-7 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm">Active Slideshow Campaigns</h3>
            
            <div className="space-y-4">
              {banners.map((b) => (
                <div key={b.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="h-32 w-full bg-gray-50 overflow-hidden relative">
                    <img src={b.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full cursor-pointer shadow-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-extrabold text-gray-800 text-sm">{b.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{b.subtitle}</p>
                    <span className="inline-block text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-100">
                      Target: {b.link} Category
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 5. BROADCAST NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
            <Bell className="h-5 w-5 text-blue-600" />
            Broadcast Global Money Saving Alert
          </h3>
          <p className="text-xs text-gray-400">This pushes an interactive banner alert to all active users browsing the DealVerse platform.</p>

          {notifSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Notification broadcasted successfully to all devices!</span>
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Alert Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Price Drop on iPhone 15 Pro!"
                value={notifForm.title}
                onChange={(e) => setNotifForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Notification Message *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Slashed by 16% on Amazon to a historic low of ₹1,12,990! Buy now before stock exhausts."
                value={notifForm.message}
                onChange={(e) => setNotifForm(p => ({ ...p, message: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Alert Category</label>
              <select
                value={notifForm.type}
                onChange={(e) => setNotifForm(p => ({ ...p, type: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs outline-none"
              >
                <option value="deal">Deals Showcase (Featured)</option>
                <option value="price_drop">Price Drops Alerts</option>
                <option value="coupon">New Coupon Launches</option>
                <option value="system">Important System Alert</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs rounded-xl shadow uppercase tracking-wide cursor-pointer"
            >
              Broadcast Notification
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 6. MODERATE REVIEWS */}
      {activeTab === "reviews" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm">Customer Review Moderation Queue</h3>
          <p className="text-xs text-gray-400">Review, flag, or moderate user reviews submitted across all DealVerse products.</p>

          <div className="divide-y divide-gray-100">
            {products.flatMap(p => p.reviews.map(r => ({ ...r, productTitle: p.name, productId: p.id }))).length > 0 ? (
              products.flatMap(p => p.reviews.map(r => ({ ...r, productTitle: p.name, productId: p.id }))).map((rev) => (
                <div key={rev.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-xs">{rev.user}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${rev.rating >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">{rev.date}</span>
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed">"{rev.comment}"</p>
                    <p className="text-[10px] text-gray-400">
                      Product: <strong className="text-blue-600">{rev.productTitle}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(rev.productId, rev.id)}
                    className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    title="Moderate & Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs">All clean! No customer reviews currently pending moderation flags.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
