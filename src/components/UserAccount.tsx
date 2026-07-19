import React, { useState, useEffect } from "react";
import { 
  User, Mail, Heart, Bell, Settings, Moon, Sun, Copy, Check, 
  Trash2, LogIn, UserPlus, Eye, ShoppingBag, ShieldCheck, CheckCircle 
} from "lucide-react";
import { Product, UserProfile, Notification } from "../types";

interface UserAccountProps {
  wishlistProducts: Product[];
  savedProducts: Product[];
  recentlyViewedProducts: Product[];
  onSelectProduct: (id: string) => void;
  onToggleWishlist: (id: string) => void;
  onToggleSaveDeal: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  token: string | null;
}

export default function UserAccount({
  wishlistProducts,
  savedProducts,
  recentlyViewedProducts,
  onSelectProduct,
  onToggleWishlist,
  onToggleSaveDeal,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  token
}: UserAccountProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist" | "notifications" | "settings">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [copiedNotifId, setCopiedNotifId] = useState<string | null>(null);

  // Profile Edit fields
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  const fetchProfile = () => {
    if (!token) return;
    fetch("/api/profile", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setProfileName(data.name);
        setProfileEmail(data.email);
      })
      .catch((err) => console.error("Failed to load profile", err));
  };

  const fetchNotifications = () => {
    if (!token) return;
    fetch("/api/notifications", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Failed to load notifications", err));
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileName, email: profileEmail })
      });
      if (res.ok) {
        setEditSuccess(true);
        fetchProfile();
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { 
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNotifId(id);
    setTimeout(() => setCopiedNotifId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
      {profile && (
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="relative mx-auto h-24 w-24 rounded-full overflow-hidden border-4 border-blue-50 dark:border-blue-950 bg-gray-50 dark:bg-slate-800 shadow animate-pulse-subtle">
              <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg flex items-center justify-center gap-1.5">
                {profile.name}
                {profile.role === "admin" && (
                  <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded uppercase">Admin</span>
                )}
              </h3>
              <p className="text-xs text-gray-400 font-medium">{profile.email}</p>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2 border border-gray-100 dark:border-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>

          {/* Vertical Menu */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm text-xs font-bold divide-y divide-gray-50">
            {[
              { id: "profile", label: "My Profile Details", icon: User },
              { id: "wishlist", label: "My Deals Wishlist & Saves", icon: Heart },
              { id: "notifications", label: "Alerts & Notifications", icon: Bell },
              { id: "settings", label: "Preferences & Appearance", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50/50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                  {tab.id === "notifications" && notifications.filter(n => !n.read).length > 0 && (
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: MAIN CONTENT ACCORDING TO TABS */}
      <div className="md:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm h-fit space-y-6">
        
        {/* TAB 1: PROFILE DETAILS */}
        {activeTab === "profile" && profile && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Account Profile Settings
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure your public name and notification email destination.</p>
            </div>

            {editSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Profile configurations saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50/20 rounded-xl outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-gray-600 block mb-1.5">Registered Email *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50/20 rounded-xl outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 space-y-2">
                <h4 className="text-gray-800 text-xs font-extrabold uppercase tracking-wide">Secure Membership Info</h4>
                <div className="grid grid-cols-2 text-[10px] text-gray-500">
                  <p>Account Role: <strong className="text-gray-700 uppercase font-extrabold">{profile.role}</strong></p>
                  <p>Sync ID: <strong className="text-gray-700 font-mono">DVER_98048BCA</strong></p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow uppercase cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: WISHLIST & SAVED DEALS */}
        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" /> My Saved Deals & Wishlist
              </h2>
              <p className="text-xs text-gray-400 mt-1">Easily trace your favorited items and monitor price changes.</p>
            </div>

            {/* Wishlist Grid */}
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlistProducts.map((p) => (
                  <div key={p.id} className="group border border-gray-100 bg-white p-3.5 rounded-2xl flex gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <button onClick={() => onSelectProduct(p.id)} className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer">
                      <img src={p.image} alt="" className="h-full w-full object-contain p-1" referrerPolicy="no-referrer" />
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 onClick={() => onSelectProduct(p.id)} className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 cursor-pointer">
                          {p.name}
                        </h4>
                        <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block w-fit mt-1">
                          {p.platform} Deal
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-xs font-black text-gray-900">₹{p.offerPrice.toLocaleString()}</span>
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-semibold">No favorited items yet! Click the heart on any product to save it.</p>
              </div>
            )}

            {/* Recently Viewed list horizontally */}
            {recentlyViewedProducts.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1">
                  <Eye className="h-4 w-4 text-gray-500" /> Recently Viewed
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 pr-1">
                  {recentlyViewedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProduct(p.id)}
                      className="w-32 flex-shrink-0 text-left space-y-1.5 p-2 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow transition-all cursor-pointer"
                    >
                      <div className="h-20 bg-white rounded-lg flex items-center justify-center p-1 border border-gray-100">
                        <img src={p.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-800 line-clamp-1">{p.name}</p>
                      <span className="text-[10px] font-black text-gray-900 block">₹{p.offerPrice.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALERTS & NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" /> Notifications & Price Drop Alerts
              </h2>
              <p className="text-xs text-gray-400 mt-1">Check coupon updates, exclusive deals, and subscribed price drop triggers.</p>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex justify-between gap-4 ${
                      n.read 
                        ? "border-gray-100 bg-white" 
                        : "border-blue-100 bg-blue-50/30 shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[85%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          n.type === "price_drop" ? "bg-red-100 text-red-600" :
                          n.type === "coupon" ? "bg-orange-100 text-orange-600" :
                          n.type === "deal" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
                        }`}>
                          {n.type === "price_drop" ? "Price Drop" : n.type === "coupon" ? "Promo Code" : "Deals Board"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-gray-800 text-xs sm:text-sm">{n.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkNotifRead(n.id)}
                          className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                        >
                          Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-semibold">All clean! No active money-saving notifications at this moment.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PREFERENCES & DARK MODE */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" /> Preference Configuration
              </h2>
              <p className="text-xs text-gray-400 mt-1">Control visual settings and automated alert options.</p>
            </div>

            <div className="space-y-5 text-xs font-bold text-gray-700">
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/40">
                <div className="space-y-0.5">
                  <span className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                    {isDarkMode ? <Moon className="h-4 w-4 text-blue-600" /> : <Sun className="h-4 w-4 text-orange-500" />}
                    Appearance Theme
                  </span>
                  <p className="text-[11px] text-gray-400 font-medium">Toggle between high-contrast light and charcoal dark themes.</p>
                </div>

                <button
                  onClick={onToggleDarkMode}
                  className={`h-7 w-14 rounded-full p-0.5 transition-all cursor-pointer ${
                    isDarkMode ? "bg-blue-600 flex justify-end" : "bg-gray-200 flex justify-start"
                  }`}
                >
                  <div className="h-6 w-6 rounded-full bg-white shadow flex items-center justify-center text-[10px]">
                    {isDarkMode ? "🌙" : "☀️"}
                  </div>
                </button>
              </div>

              {/* General checkboxes */}
              <div className="space-y-3.5">
                <h3 className="text-gray-800 text-xs font-extrabold uppercase tracking-wide border-b border-gray-100 pb-1.5">Alert Subscriptions</h3>
                
                {[
                  { label: "Receive Real-time Email Alerts", desc: "Notify via email immediately when favorite products drop in price.", checked: true },
                  { label: "Exclusive Coupon Notifications", desc: "Receive alerts for flash shopping coupons from Amazon & Flipkart.", checked: true },
                  { label: "Enable Voice Output for Deal AI", desc: "Allows Deal AI to read out search responses when Voice is selected.", checked: false }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer p-1">
                    <input type="checkbox" defaultChecked={item.checked} className="h-4.5 w-4.5 text-blue-600 rounded border-gray-200 mt-0.5" />
                    <div>
                      <span className="text-gray-800 font-bold block">{item.label}</span>
                      <span className="text-[11px] text-gray-400 font-medium block mt-0.5 leading-relaxed">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
