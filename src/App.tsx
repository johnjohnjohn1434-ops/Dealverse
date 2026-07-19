import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Bell, Sparkles, Tag, Flame, Shield, ArrowRight, User as UserIcon, 
  Settings, Grid, TrendingUp, Award, Clock, Heart, Share2, ExternalLink, 
  ChevronLeft, ChevronRight, Volume2, Info, Moon, Sun, Laptop, Laptop2, ShoppingBag 
} from "lucide-react";
import { Product, Coupon, Banner, Notification, UserProfile } from "./types";
import DealAI from "./components/DealAI";
import ProductDetail from "./components/ProductDetail";
import AdminPanel from "./components/AdminPanel";
import UserAccount from "./components/UserAccount";
import AuthScreen from "./components/AuthScreen";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert } from "lucide-react";

interface Ripple {
  id: number;
  x: number;
  y: number;
  colors: string;
}

function AccessDenied403({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="glass-card-dark p-8 sm:p-12 rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-40 w-40 bg-red-500/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-orange-500/5 rounded-full blur-3xl -translate-x-10 translate-y-10"></div>

        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <ShieldAlert className="h-10 w-10 text-red-500 animate-pulse" />
            <div className="absolute inset-[-6px] rounded-full border border-dashed border-red-500/30 animate-[spin_10s_linear_infinite]"></div>
          </div>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 tracking-tight mb-4">
          ERROR 403: SYSTEM ACCESS DENIED
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-red-400 mb-6 font-bold">
          SECURITY PROTOCOL ENFORCED
        </p>
        
        <p className="text-sm text-gray-400 dark:text-gray-300 max-w-md mx-auto leading-relaxed mb-8">
          The requested administration node is exclusively reserved for the **Super Admin**. Normal user clearance is insufficient to bridge this terminal sector.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.03] transition-transform cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          >
            Bridge to Safe Coordinates
          </button>
          <button
            onClick={() => alert("Access clearance request beamed to the Super Admin terminal.")}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            Request Access
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("dealverse_token") || sessionStorage.getItem("dealverse_token")
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Filter & Navigation states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "discount" | "views" | "price-low" | "price-high">("recent");
  
  // App view control (main home, user account profile, admin panel)
  const [currentView, setCurrentView] = useState<"home" | "account" | "admin">("home");
  
  // Modal detail states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Infinite Scroll limit
  const [visibleCount, setVisibleCount] = useState(8);

  // Active Broadcast Toast state (if admin sends notification)
  const [latestToast, setLatestToast] = useState<Notification | null>(null);

  // Real-time flash sale countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 24, seconds: 56 });

  // Dynamic premium gradient ripple states
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleGlobalClick = (e: React.MouseEvent) => {
    const gradients = [
      "from-cyan-400/25 via-blue-500/25 to-purple-600/25 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
      "from-purple-500/25 via-pink-500/25 to-orange-400/25 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      "from-pink-500/25 via-red-500/25 to-amber-400/25 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
      "from-teal-400/25 via-cyan-500/25 to-blue-600/25 shadow-[0_0_20px_rgba(20,184,166,0.2)]",
      "from-orange-400/25 via-pink-500/25 to-purple-500/25 shadow-[0_0_20px_rgba(251,146,60,0.2)]",
      "from-purple-600/25 via-indigo-600/25 to-cyan-500/25 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];
    const newRipple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      colors: randomGrad
    };
    setRipples((prev) => [...prev, newRipple].slice(-10));
  };

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        setScrollOffset(window.scrollY / maxScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load initial data
  const loadData = (currentToken: string) => {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${currentToken}`
    };

    fetch("/api/deals", { headers })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) setProducts(data);
      })
      .catch(e => console.error(e));

    fetch("/api/coupons", { headers })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.ok ? res.json() : [];
      })
      .then((data) => {
        if (data && Array.isArray(data)) setCoupons(data);
      })
      .catch(e => console.error(e));

    fetch("/api/banners", { headers })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.ok ? res.json() : [];
      })
      .then((data) => {
        if (data && Array.isArray(data)) setBanners(data);
      })
      .catch(e => console.error(e));

    fetch("/api/notifications", { headers })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.ok ? res.json() : [];
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setNotifications(data);
          const unread = data.filter((n: Notification) => !n.read);
          if (unread.length > 0) {
            setLatestToast(unread[0]);
          }
        }
      })
      .catch(e => console.error(e));

    fetch("/api/profile", { headers })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data && data.email) {
          setUserProfile(data);
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token]);

  const handleLogout = () => {
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }).catch(e => console.error(e));
    }
    localStorage.removeItem("dealverse_token");
    sessionStorage.removeItem("dealverse_token");
    setToken(null);
    setUserProfile(null);
    setProducts([]);
    setCoupons([]);
    setBanners([]);
    setNotifications([]);
    setCurrentView("home");
  };

  // Set up timer for flash sale
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 0, seconds: 0 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll banner slider
  useEffect(() => {
    if (banners.length === 0) return;
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(bannerInterval);
  }, [banners]);

  // Dark Mode side effects
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Handle manual /admin navigation or #admin hash
  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || hash === "#admin") {
        setCurrentView("admin");
      }
    };
    handleUrlCheck();
    window.addEventListener("popstate", handleUrlCheck);
    window.addEventListener("hashchange", handleUrlCheck);
    return () => {
      window.removeEventListener("popstate", handleUrlCheck);
      window.removeEventListener("hashchange", handleUrlCheck);
    };
  }, []);

  // Toggle Wishlist
  const handleToggleWishlist = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/wishlist/${id}`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUserProfile(updatedUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Save Deal
  const handleToggleSaveDeal = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/save-deal/${id}`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUserProfile(updatedUser);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bridge callback for floating Deal AI: scrolls to recommended item and opens details modal!
  const handleAIRecommendation = (productId: string) => {
    setSelectedProductId(productId);
    // Find item element and scroll elegantly
    setTimeout(() => {
      const el = document.getElementById(`product-card-${productId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add temporary pulsing border ring
        el.classList.add("ring-4", "ring-orange-500", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-orange-500", "ring-offset-2");
        }, 4000);
      }
    }, 500);
  };

  // Main list filters calculation
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesPlatform = selectedPlatform === "All" || p.platform === selectedPlatform;

    return matchesSearch && matchesCategory && matchesPlatform;
  });

  // Main list sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "discount") {
      return b.discount - a.discount;
    }
    if (sortBy === "views") {
      return b.views - a.views;
    }
    if (sortBy === "price-low") {
      return a.offerPrice - b.offerPrice;
    }
    if (sortBy === "price-high") {
      return b.offerPrice - a.offerPrice;
    }
    return 0;
  });

  const handleShareDeal = (p: Product) => {
    const shareText = `🔥 HOT DEAL on ${p.platform}: ${p.name} is on sale for ₹${p.offerPrice.toLocaleString()} (${p.discount}% off!). Find more at DealVerse!`;
    navigator.clipboard.writeText(shareText);
    alert("Deal shared to clipboard successfully!");
  };

  // Categories details with custom icons
  const categoriesList = [
    { name: "All", emoji: "🛍️" },
    { name: "Mobiles", emoji: "📱" },
    { name: "Fashion", emoji: "👕" },
    { name: "Electronics", emoji: "🎧" },
    { name: "Home", emoji: "🏠" },
    { name: "Kitchen", emoji: "🍳" },
    { name: "Beauty", emoji: "💄" },
    { name: "Footwear", emoji: "👟" },
    { name: "Watches", emoji: "⌚" },
    { name: "Gaming", emoji: "🎮" },
    { name: "Accessories", emoji: "🎒" },
    { name: "Furniture", emoji: "🪑" },
    { name: "Books", emoji: "📚" },
    { name: "Kids", emoji: "🧸" },
    { name: "Sports", emoji: "⚽" },
    { name: "Travel", emoji: "✈️" },
    { name: "Health", emoji: "💊" }
  ];

  const getPlatformStyle = (plat: string) => {
    switch (plat.toLowerCase()) {
      case "amazon": return "bg-[#ff9900]/10 text-[#ff9900]";
      case "flipkart": return "bg-[#2874f0]/10 text-[#2874f0]";
      case "meesho": return "bg-[#f43f5e]/10 text-[#f43f5e]";
      case "myntra": return "bg-[#ec4899]/10 text-[#ec4899]";
      case "ajio": return "bg-slate-900/10 text-slate-800";
      default: return "bg-blue-50 text-blue-600";
    }
  };

  if (!token) {
    return (
      <AuthScreen 
        isDarkMode={isDarkMode} 
        onAuthSuccess={(newToken, newUser) => {
          setToken(newToken);
          setUserProfile(newUser);
          loadData(newToken);
        }} 
      />
    );
  }

  return (
    <div 
      onClick={handleGlobalClick}
      className={`min-h-screen transition-colors duration-200 bg-slate-50 text-slate-900 relative ${isDarkMode ? "dark bg-slate-950 text-white" : ""}`}
    >
      {/* 0. DYNAMIC LUXURY TAP/CLICK GRADIENT WAVE RIPPLES */}
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            initial={{ scale: 0, opacity: 0.95 }}
            animate={{ scale: 12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.1, 0.8, 0.3, 1] }}
            style={{
              position: "absolute",
              left: r.x - 20,
              top: r.y - 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
            }}
            className={`bg-gradient-to-tr ${r.colors} blur-xl`}
          />
        ))}
      </div>

      {/* BACKGROUND CONTINUOUSLY ANIMATING SOFT GRADIENT WAVES */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-slate-50 dark:bg-slate-950 transition-colors duration-1000">
        <div 
          className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-cyan-400/10 via-blue-500/10 to-purple-500/10 blur-[130px] animate-pulse-slow"
          style={{ 
            animationDuration: "25s",
            filter: `hue-rotate(${scrollOffset * 360}deg) blur(130px)`
          }}
        ></div>
        <div 
          className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-pink-500/10 via-purple-600/10 to-orange-400/10 blur-[130px] animate-pulse-slow"
          style={{ 
            animationDuration: "35s",
            filter: `hue-rotate(${scrollOffset * 360 + 120}deg) blur(130px)`
          }}
        ></div>
        <div 
          className="absolute top-[35%] left-[25%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-teal-400/5 via-cyan-500/5 to-purple-400/5 blur-[120px] animate-pulse-slow"
          style={{ 
            animationDuration: "20s",
            filter: `hue-rotate(${scrollOffset * 360 + 240}deg) blur(120px)`
          }}
        ></div>
      </div>
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors">
        {/* Animated fluid gradient top indicator bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-600 to-pink-500 bg-[length:200%_auto] animate-gradient-shift"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <button 
            onClick={() => setCurrentView("home")} 
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/15">
              <Sparkles className="h-5.5 w-5.5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                DealVerse
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block leading-none">Smart Affiliate Hub</span>
            </div>
          </button>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals, coupons, mobiles, sneakers, ANC headphones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 outline-none focus:border-blue-500 dark:focus:border-blue-600 transition-colors text-xs font-semibold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold hover:text-gray-600">
                Clear
              </button>
            )}
          </div>

          {/* User & Settings menu */}
          <div className="flex items-center gap-3">
            
            {/* Dark Mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5 text-orange-400" /> : <Moon className="h-4.5 w-4.5 text-gray-500" />}
            </button>

            {/* Notification Badge with overlay drop */}
            <button
              onClick={() => {
                setCurrentView("account");
              }}
              className="relative p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Admin trigger if admin */}
            {userProfile?.role === "super_admin" && (
              <button
                onClick={() => setCurrentView(currentView === "admin" ? "home" : "admin")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer flex items-center gap-1 border transition-all ${
                  currentView === "admin"
                    ? "bg-red-600 text-white border-red-600 shadow"
                    : "bg-white text-red-600 border-red-100 dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <Shield className="h-3.5 w-3.5 animate-pulse" />
                <span>Admin</span>
              </button>
            )}

            {/* Member Profile view trigger */}
            {userProfile && (
              <button
                onClick={() => setCurrentView(currentView === "account" ? "home" : "account")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  currentView === "account"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}
              >
                <img src={userProfile.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                <span className="hidden sm:inline truncate max-w-[100px]">{userProfile.name.split(" ")[0]}</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden p-3.5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deals, brands, coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 outline-none focus:border-blue-500 dark:focus:border-blue-600 text-xs font-semibold"
          />
        </div>
      </div>

      {/* 2. LIVE BROADCAST BANNER ALERTS TOAST */}
      <AnimatePresence>
        {latestToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white py-2.5 px-4 shadow-xl flex items-center justify-between text-xs font-semibold"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
              <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">LIVE ALERT</span>
              <p>
                <strong>{latestToast.title}:</strong> {latestToast.message}
              </p>
            </div>
            <button 
              onClick={() => setLatestToast(null)} 
              className="text-white hover:text-orange-200 ml-4 font-bold border border-white/20 px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CORE VIEWS SWITCH */}

      {/* VIEW A: ADMIN PANEL */}
      {currentView === "admin" && (
        <main className="py-6 sm:py-10 bg-slate-100/50 dark:bg-slate-950/20">
          {userProfile?.role === "super_admin" ? (
            <AdminPanel 
              products={products}
              token={token}
              onRefreshProducts={() => {
                loadData(token!);
                setCurrentView("home");
              }} 
            />
          ) : (
            <AccessDenied403 onGoHome={() => setCurrentView("home")} />
          )}
        </main>
      )}

      {/* VIEW B: USER ACCOUNT PROFILE */}
      {currentView === "account" && userProfile && (
        <main className="py-6 sm:py-10 bg-slate-100/50 dark:bg-slate-950/20">
          <UserAccount
            wishlistProducts={products.filter((p) => userProfile.wishlist.includes(p.id))}
            savedProducts={products.filter((p) => userProfile.savedDeals.includes(p.id))}
            recentlyViewedProducts={products.filter((p) => userProfile.recentlyViewed.includes(p.id))}
            onSelectProduct={(id) => setSelectedProductId(id)}
            onToggleWishlist={handleToggleWishlist}
            onToggleSaveDeal={handleToggleSaveDeal}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            token={token}
          />
        </main>
      )}

      {/* VIEW C: HOME PAGE LANDING */}
      {currentView === "home" && (
        <main className="space-y-10 pb-20">
          
          {/* HERO CAMPAIGNS CAROUSEL SLIDER */}
          {banners.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
              <div className="relative h-80 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBannerIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={banners[currentBannerIndex].image}
                      alt={banners[currentBannerIndex].title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/45 to-transparent" />
                    
                    {/* Glassmorphic Description overlay card */}
                    <div className="absolute bottom-6 left-6 right-6 md:left-10 md:bottom-10 md:max-w-xl bg-white/15 dark:bg-slate-900/40 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/20 text-white space-y-2.5">
                      <span className="bg-orange-500 text-white font-black px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider block w-fit">
                        Featured Campaign
                      </span>
                      <h2 className="text-xl sm:text-2xl font-display font-black leading-tight tracking-tight text-white">
                        {banners[currentBannerIndex].title}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-semibold">
                        {banners[currentBannerIndex].subtitle}
                      </p>
                      
                      <button
                        onClick={() => setSelectedCategory(banners[currentBannerIndex].link)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md"
                      >
                        Explore Category
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Left/Right buttons */}
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 border border-white/20 p-2 rounded-full text-white cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 border border-white/20 p-2 rounded-full text-white cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </section>
          )}

          {/* CATEGORIES HORIZONTAL NAVIGATION SCROLLER */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-gray-800 dark:text-white flex items-center gap-1.5">
                <Grid className="h-5 w-5 text-blue-600" /> Browse Top Categories
              </h3>
              <span className="text-xs text-gray-400 font-bold">16+ Smart Channels</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 select-none scrollbar-hide">
              {categoriesList.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setVisibleCount(8); // reset pagination
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                    selectedCategory === cat.name
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 scale-105"
                      : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* FLASH SALE WITH COUNTDOWN TIMER */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white leading-none shadow-sm">
                    <Flame className="h-3.5 w-3.5 fill-white animate-bounce" /> Flash Deals Live
                  </div>
                  <h2 className="text-xl sm:text-3xl font-display font-black leading-tight tracking-tight">
                    Exclusive Cyber Monday Lightning Deals!
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    Huge limited-quantity platform discounts automatically verified by Deal AI. Snatch them up before time exhausts!
                  </p>
                </div>

                {/* Countdown Box */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-xs text-white/70 block uppercase font-bold">Ends In</span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-xl sm:text-2xl font-black">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/25">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <span className="animate-pulse">:</span>
                      <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/25">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <span className="animate-pulse">:</span>
                      <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/25">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider list of Flash items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                {products.filter(p => p.tags.includes("Flash Sale")).slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-left hover:bg-white/20 transition-all cursor-pointer group flex flex-col justify-between h-fit"
                  >
                    <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3.5 flex items-center justify-center p-2">
                      <img src={p.image} alt="" className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-1 text-white">
                      <span className="text-[9px] uppercase font-bold tracking-widest bg-orange-600 text-white px-1.5 py-0.5 rounded">
                        {p.platform}
                      </span>
                      <h4 className="text-xs font-bold line-clamp-1 pt-1 group-hover:text-orange-200">{p.name}</h4>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-black">₹{p.offerPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-white/80 line-through">₹{p.mrp.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </section>

          {/* MAIN DEALS EXPLORER SECTION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            
            {/* Filter Bar Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base text-gray-800 dark:text-white">
                  {selectedCategory === "All" ? "Today's Best Money Saving Deals" : `${selectedCategory} Deals`}
                </h3>
                <span className="text-xs bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                  {sortedProducts.length} Offers
                </span>
              </div>

              {/* Filtering menus */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                
                {/* Platform select filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Platform:</span>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <option value="All">All Stores</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Shopsy">Shopsy</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Ajio">Ajio</option>
                  </select>
                </div>

                {/* Sort By selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="discount">Highest Discount %</option>
                    <option value="views">Most Popular (Views)</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

              </div>
            </div>

            {/* PRODUCT DEALS GRID */}
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {sortedProducts.slice(0, visibleCount).map((p) => {
                  const isWishlisted = userProfile?.wishlist.includes(p.id) || false;
                  return (
                    <div
                      key={p.id}
                      id={`product-card-${p.id}`}
                      className="group border border-gray-100 dark:border-slate-800/80 hover:animate-border-glow hover:shadow-xl bg-white dark:bg-slate-900 rounded-2xl p-4 text-left transition-all hover:-translate-y-1.5 flex flex-col justify-between h-[410px] relative"
                    >
                      {/* Wishlist floating toggle */}
                      <button
                        onClick={() => handleToggleWishlist(p.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full border shadow-sm z-10 cursor-pointer transition-all ${
                          isWishlisted
                            ? "bg-pink-50 border-pink-100 text-pink-600"
                            : "bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-pink-500"
                        }`}
                      >
                        <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-pink-600" : ""}`} />
                      </button>

                      {/* Image Frame */}
                      <div 
                        onClick={() => setSelectedProductId(p.id)}
                        className="aspect-video sm:aspect-square bg-gray-50/70 dark:bg-slate-800/50 rounded-xl overflow-hidden mb-4 flex items-center justify-center relative p-3 cursor-pointer"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Discount Badge */}
                        <div className="absolute bottom-3 left-3 bg-orange-500 text-white font-black text-[10px] px-2 py-1 rounded-lg shadow-md uppercase">
                          {p.discount}% OFF
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Store badge & tag indicators */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getPlatformStyle(p.platform)}`}>
                              {p.platform}
                            </span>
                            {p.tags.slice(0, 1).map((t, idx) => (
                              <span key={idx} className="text-[9px] uppercase font-bold tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>

                          <h3 
                            onClick={() => setSelectedProductId(p.id)}
                            className="font-display font-extrabold text-sm text-gray-800 dark:text-white leading-snug tracking-tight line-clamp-2 mt-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          >
                            {p.name}
                          </h3>
                        </div>

                        {/* Prices & Actions */}
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-2 pt-1 border-t border-gray-50 dark:border-slate-800">
                            <span className="text-lg font-black text-gray-900 dark:text-white">
                              ₹{p.offerPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{p.mrp.toLocaleString()}
                            </span>
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center gap-2">
                            <a
                              href={p.affiliateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-[11px] py-2 px-1 rounded-xl flex items-center justify-center gap-1 hover:shadow-md transition-all uppercase cursor-pointer text-center"
                            >
                              Buy Now
                              <ExternalLink className="h-3 w-3" />
                            </a>

                            <button
                              onClick={() => handleShareDeal(p)}
                              className="p-2 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer"
                              title="Copy Share Link"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-bounce" />
                <p className="text-sm text-gray-500 font-semibold">No deals found matching search terms. Type something else or ask Deal AI below!</p>
              </div>
            )}

            {/* Pagination Load More trigger */}
            {sortedProducts.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="px-6 py-3 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 font-extrabold text-xs rounded-xl shadow-sm uppercase tracking-wide cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Clock className="h-4 w-4 animate-spin" />
                  Load More Money Saving Deals
                </button>
              </div>
            )}

          </section>

          {/* TODAY'S EXCLUSIVE PROMO CODE TICKETS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3 mb-6">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-gray-800 dark:text-white flex items-center gap-1.5">
                <Tag className="h-5 w-5 text-orange-500" /> Active Platform Coupons & Promo Tickets
              </h3>
              <p className="text-xs text-gray-400 mt-1">Copy and apply these at platform checkout to enjoy instant absolute lowest prices.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="border border-dashed border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 h-12 w-12 bg-blue-50 dark:bg-blue-950 rounded-full"></div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                        {c.platform}
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded">
                        {c.discountText}
                      </span>
                    </div>
                    <h4 className="font-mono font-black text-gray-900 dark:text-white text-base tracking-wider pt-1">{c.code}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{c.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      alert(`Promo Code ${c.code} copied to clipboard!`);
                    }}
                    className="w-full py-2 mt-4 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-xl cursor-pointer text-center uppercase tracking-wider"
                  >
                    Copy Promo Ticket Code
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* REALISTIC SHOPPING ILLUSTRATIONS HERO CARDS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-tr from-gray-950 via-slate-900 to-blue-950 text-white rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
              <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase leading-none">
                  <Volume2 className="h-3.5 w-3.5" /> Direct Referral Channel
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-black leading-tight tracking-tight text-white">
                  We Scan, You Save. Absolute Zero Surcharge!
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-semibold">
                  DealVerse compiles prices across Meesho, Shopsy, Flipkart, and Amazon to direct you only to the lowest verified option. We add custom coupons, review ratings, and price histories. Click, buy, and save!
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-green-400"></span> Live Monitoring
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-orange-400"></span> Verified Coupons
                  </div>
                </div>
              </div>

              {/* Shopping Bags Glassmorphic Container Illustration */}
              <div className="w-full md:w-80 h-60 rounded-2xl overflow-hidden border border-white/20 relative shadow-lg bg-white/5 backdrop-blur">
                <img
                  src="/src/assets/images/coupon_gift_illustration_1784415935686.jpg"
                  alt="Referrals illustration"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/giftdeals/400/300";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white text-xs font-black uppercase">
                  ⭐ 100% Secure Affiliate Links
                </div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* 4. PRODUCT DETAILS MODAL DRAWER */}
      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          wishlist={userProfile?.wishlist || []}
          onToggleWishlist={handleToggleWishlist}
          onToggleSaveDeal={handleToggleSaveDeal}
          savedDeals={userProfile?.savedDeals || []}
          relatedProducts={products.filter((p) => p.id !== selectedProductId)}
          onSelectProduct={(id) => setSelectedProductId(id)}
          token={token}
        />
      )}

      {/* 5. FLOATING AI ASSISTANT: DEAL AI */}
      <DealAI onRecommendProduct={handleAIRecommendation} token={token} />

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-display font-black text-gray-800 dark:text-white">DealVerse</span>
              <p className="text-[10px] text-gray-400">Copyright © 2026. All Rights Reserved.</p>
            </div>
          </div>

          <div className="flex gap-6 text-xs font-bold text-gray-500 dark:text-gray-400">
            <button onClick={() => { setCurrentView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-blue-600">Explore Deals</button>
            <button onClick={() => { setCurrentView("account"); }} className="hover:text-blue-600">Saved Alerts</button>
            <button onClick={() => { setCurrentView("admin"); }} className="hover:text-blue-600">Affiliate Login</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
