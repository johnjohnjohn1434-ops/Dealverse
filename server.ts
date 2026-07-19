import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Product, Coupon, Banner, Notification, UserProfile, DashboardAnalytics } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY not configured or is placeholder. Deal AI will use high-quality fallback replies.");
}

// Data Store Path
const DATA_FILE = path.join(process.cwd(), "data_store.json");

// Default/Initial Data Seeds
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Apple iPhone 15 Pro (128 GB, Natural Titanium)",
    description: "Experience the power of titanium with the iPhone 15 Pro. Features an advanced A17 Pro chip, customizable Action button, the most powerful iPhone camera system ever, and a stunning Super Retina XDR display with ProMotion.",
    mrp: 134900,
    offerPrice: 112990,
    discount: 16,
    platform: "Amazon",
    affiliateLink: "https://www.amazon.in/dp/B0CHX1W1YW",
    category: "Mobiles",
    image: "https://picsum.photos/seed/iphone15pro/600/400",
    gallery: [
      "https://picsum.photos/seed/iphone15pro/600/400",
      "https://picsum.photos/seed/iphone15back/600/400",
      "https://picsum.photos/seed/iphone15side/600/400"
    ],
    stockStatus: "In Stock",
    tags: ["Featured", "Trending", "Lowest Price"],
    specs: [
      { key: "Display", value: "6.1-inch Super Retina XDR display" },
      { key: "Processor", value: "A17 Pro chip with 6-core GPU" },
      { key: "Camera", value: "Pro camera system (48MP Main, 12MP Ultra Wide, 12MP Telephoto)" },
      { key: "Connector", value: "USB-C (supports USB 3)" }
    ],
    priceHistory: [
      { date: "May 2026", price: 124900 },
      { date: "June 2026", price: 119990 },
      { date: "July 2026", price: 112990 }
    ],
    ratings: 4.8,
    reviews: [
      { id: "r1", user: "Arun Kumar", rating: 5, comment: "Incredible battery life and the titanium body feels super light!", date: "2026-07-10" },
      { id: "r2", user: "Neha Sharma", rating: 4, comment: "Superb camera quality, but gets slightly warm during heavy gaming.", date: "2026-07-12" }
    ],
    views: 1245,
    shares: 342,
    couponCode: "IPHONE15SAVE",
    couponDiscount: "Flat ₹2,000 Off",
    createdAt: "2026-07-01T10:00:00Z"
  },
  {
    id: "p2",
    name: "OnePlus 12R (Misty Blue, 16GB RAM + 256GB Storage)",
    description: "The OnePlus 12R delivers elite flagship performance. It boasts a high-refresh fourth-gen LTPO AMOLED display, Snapdragon 8 Gen 2 CPU, dual cryo-velocity cooling, and 100W SUPERVOOC charging.",
    mrp: 45999,
    offerPrice: 39999,
    discount: 13,
    platform: "Flipkart",
    affiliateLink: "https://www.flipkart.com",
    category: "Mobiles",
    image: "https://picsum.photos/seed/oneplus12r/600/400",
    gallery: [
      "https://picsum.photos/seed/oneplus12r/600/400",
      "https://picsum.photos/seed/oneplus12rback/600/400"
    ],
    stockStatus: "In Stock",
    tags: ["Trending", "Flash Sale"],
    specs: [
      { key: "Display", value: "6.78-inch 120Hz AMOLED ProXDR" },
      { key: "Processor", value: "Snapdragon 8 Gen 2" },
      { key: "RAM/Storage", value: "16GB LPDDR5X | 256GB UFS 3.1" },
      { key: "Battery/Charging", value: "5500 mAh with 100W SUPERVOOC" }
    ],
    priceHistory: [
      { date: "May 2026", price: 42999 },
      { date: "June 2026", price: 41999 },
      { date: "July 2026", price: 39999 }
    ],
    ratings: 4.6,
    reviews: [
      { id: "r3", user: "Vikram R.", rating: 5, comment: "Unbelievable charging speed! Charges in 25 minutes flat.", date: "2026-07-14" }
    ],
    views: 890,
    shares: 120,
    couponCode: "OP12RSAVE",
    couponDiscount: "Extra ₹1,000 Off",
    createdAt: "2026-07-05T12:00:00Z"
  },
  {
    id: "p3",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description: "Sony's industry-leading active noise cancellation gets even better. Outfitted with multiple microphones, custom 30mm drivers, superior call quality, and 30-hour battery life with premium comfort.",
    mrp: 34990,
    offerPrice: 26990,
    discount: 22,
    platform: "Amazon",
    affiliateLink: "https://www.amazon.in",
    category: "Electronics",
    image: "https://picsum.photos/seed/sonyxm5/600/400",
    gallery: ["https://picsum.photos/seed/sonyxm5/600/400"],
    stockStatus: "In Stock",
    tags: ["Featured", "Lowest Price"],
    specs: [
      { key: "Type", value: "Over-Ear Wireless" },
      { key: "Battery Life", value: "Up to 30 hours" },
      { key: "ANC", value: "Dual Processor V1 + HD Noise Cancelling QN1" },
      { key: "Charging", value: "Quick charge (3 min for 3 hours)" }
    ],
    priceHistory: [
      { date: "May 2026", price: 29990 },
      { date: "June 2026", price: 28990 },
      { date: "July 2026", price: 26990 }
    ],
    ratings: 4.7,
    reviews: [
      { id: "r4", user: "Divya N.", rating: 5, comment: "Absolute silence! Perfect for studying and office work.", date: "2026-07-16" }
    ],
    views: 750,
    shares: 98,
    createdAt: "2026-07-06T08:00:00Z"
  },
  {
    id: "p4",
    name: "Red Tape Men's Retro Sneakers",
    description: "Elevate your streetwear style with these retro-inspired casual sneakers from Red Tape. Designed with premium cushioning, high grip, and superior comfort for everyday wear.",
    mrp: 5499,
    offerPrice: 1399,
    discount: 74,
    platform: "Myntra",
    affiliateLink: "https://www.myntra.com",
    category: "Footwear",
    image: "https://picsum.photos/seed/redtapesneakers/600/400",
    gallery: ["https://picsum.photos/seed/redtapesneakers/600/400"],
    stockStatus: "In Stock",
    tags: ["Trending", "Lowest Price"],
    specs: [
      { key: "Material", value: "Synthetic Leather Upper" },
      { key: "Sole", value: "Durable Rubber Sole" },
      { key: "Style", value: "Retro lace-up" },
      { key: "Cushioning", value: "Memory Foam Insole" }
    ],
    priceHistory: [
      { date: "May 2026", price: 1899 },
      { date: "June 2026", price: 1599 },
      { date: "July 2026", price: 1399 }
    ],
    ratings: 4.2,
    reviews: [
      { id: "r5", user: "Rahul J.", rating: 4, comment: "Amazing value for money. Looks great with denim.", date: "2026-07-15" }
    ],
    views: 1980,
    shares: 420,
    createdAt: "2026-07-02T15:30:00Z"
  },
  {
    id: "p5",
    name: "Pigeon 1.5 Litre Electric Kettle",
    description: "Boil water quickly and safely with the Pigeon electric kettle. Durable stainless steel design, cool-touch handle, 1500W rapid boiling technology, and automatic shut-off safety feature.",
    mrp: 1195,
    offerPrice: 599,
    discount: 49,
    platform: "Shopsy",
    affiliateLink: "https://www.shopsy.in",
    category: "Kitchen",
    image: "https://picsum.photos/seed/electrickettle/600/400",
    gallery: ["https://picsum.photos/seed/electrickettle/600/400"],
    stockStatus: "In Stock",
    tags: ["Flash Sale", "Lowest Price"],
    specs: [
      { key: "Capacity", value: "1.5 Litres" },
      { key: "Power", value: "1500 Watts" },
      { key: "Material", value: "Stainless Steel" },
      { key: "Safety", value: "Auto Cut-Off | Dry Boiling Protection" }
    ],
    priceHistory: [
      { date: "May 2026", price: 699 },
      { date: "June 2026", price: 649 },
      { date: "July 2026", price: 599 }
    ],
    ratings: 4.1,
    reviews: [
      { id: "r6", user: "Suresh P.", rating: 4, comment: "Good quality and boils very fast. Perfect for making tea.", date: "2026-07-17" }
    ],
    views: 2450,
    shares: 110,
    createdAt: "2026-07-08T09:00:00Z"
  },
  {
    id: "p6",
    name: "Premium Embroidered Georgette Anarkali Kurta Set",
    description: "Look beautiful in this elegant Georgette Anarkali Kurti Set. Features heavy multi-thread embroidery, matching dupatta, soft inner lining, and flows elegantly for festive occasions.",
    mrp: 3299,
    offerPrice: 799,
    discount: 75,
    platform: "Meesho",
    affiliateLink: "https://www.meesho.com",
    category: "Fashion",
    image: "https://picsum.photos/seed/anarkalikurta/600/400",
    gallery: ["https://picsum.photos/seed/anarkalikurta/600/400"],
    stockStatus: "In Stock",
    tags: ["Trending", "Featured"],
    specs: [
      { key: "Fabric", value: "Georgette with micro cotton lining" },
      { key: "Work", value: "Embroidery & Sequins" },
      { key: "Fit", value: "Flared Anarkali regular fit" },
      { key: "Set Contains", value: "1 Kurta, 1 Pant, 1 Dupatta" }
    ],
    priceHistory: [
      { date: "May 2026", price: 999 },
      { date: "June 2026", price: 899 },
      { date: "July 2026", price: 799 }
    ],
    ratings: 4.4,
    reviews: [
      { id: "r7", user: "Priyanaka K.", rating: 5, comment: "Absolutely lovely dress. Fitting is spot on. Worth every rupee!", date: "2026-07-16" }
    ],
    views: 3450,
    shares: 612,
    createdAt: "2026-07-12T04:15:00Z"
  },
  {
    id: "p7",
    name: "Minimalist Leather Men's Watch",
    description: "A timeless masterpiece designed for the modern gentleman. Combines a slim profile stainless steel dial, premium full-grain black leather strap, and precise quartz movement.",
    mrp: 6999,
    offerPrice: 2499,
    discount: 64,
    platform: "Ajio",
    affiliateLink: "https://www.ajio.com",
    category: "Watches",
    image: "https://picsum.photos/seed/leatherwatch/600/400",
    gallery: ["https://picsum.photos/seed/leatherwatch/600/400"],
    stockStatus: "In Stock",
    tags: ["Trending"],
    specs: [
      { key: "Dial", value: "40mm Stainless Steel" },
      { key: "Movement", value: "Japanese Quartz" },
      { key: "Water Resistance", value: "5 ATM / 50 meters" },
      { key: "Strap", value: "Genuine Calf Leather" }
    ],
    priceHistory: [
      { date: "May 2026", price: 3499 },
      { date: "June 2026", price: 2999 },
      { date: "July 2026", price: 2499 }
    ],
    ratings: 4.5,
    reviews: [],
    views: 520,
    shares: 34,
    createdAt: "2026-07-14T11:45:00Z"
  },
  {
    id: "p8",
    name: "L'Oreal Paris Revitalift Hyaluronic Acid Serum",
    description: "Deeply hydrate and plump your skin with the powerful L'Oreal Hyaluronic Acid Serum. Reduces wrinkles, intensely rehydrates, and leaves skin looking radiant, youthful, and smooth.",
    mrp: 999,
    offerPrice: 699,
    discount: 30,
    platform: "Myntra",
    affiliateLink: "https://www.myntra.com",
    category: "Beauty",
    image: "https://picsum.photos/seed/lorealhyaluronic/600/400",
    gallery: ["https://picsum.photos/seed/lorealhyaluronic/600/400"],
    stockStatus: "In Stock",
    tags: ["Trending", "Flash Sale"],
    specs: [
      { key: "Active Ingredient", value: "1.5% Hyaluronic Acid" },
      { key: "Benefits", value: "Plumping, hydrating, reduces fine lines" },
      { key: "Skin Type", value: "All skin types" },
      { key: "Formulation", value: "Lightweight, non-greasy, fragrance-free" }
    ],
    priceHistory: [
      { date: "May 2026", price: 799 },
      { date: "June 2026", price: 749 },
      { date: "July 2026", price: 699 }
    ],
    ratings: 4.3,
    reviews: [
      { id: "r8", user: "Shweta G.", rating: 4, comment: "Skin feels very soft and hydrated. Fine lines are reducing slowly.", date: "2026-07-15" }
    ],
    views: 1100,
    shares: 145,
    createdAt: "2026-07-10T14:20:00Z"
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  { id: "c1", code: "AMZELECT10", description: "Get flat 10% off on premium Sony and Bose headphones on Amazon.", platform: "Amazon", discountText: "10% OFF", expiryDate: "2026-08-31", active: true },
  { id: "c2", code: "FKFASH200", description: "Save ₹200 extra on men retro sneakers or casual footwear.", platform: "Flipkart", discountText: "₹200 OFF", expiryDate: "2026-08-15", active: true },
  { id: "c3", code: "MEESHONEW", description: "Flat 20% off for first-time users on Meesho clothing products.", platform: "Meesho", discountText: "20% OFF", expiryDate: "2026-12-31", active: true },
  { id: "c4", code: "AJIOSELECT", description: "Extra 15% discount on selected premium watches and sunglasses.", platform: "Ajio", discountText: "15% OFF", expiryDate: "2026-09-30", active: true }
];

const DEFAULT_BANNERS: Banner[] = [
  { id: "b1", image: "https://picsum.photos/seed/bannerdeals/1200/500", title: "DealVerse Mega Electronics Carnival", subtitle: "Up to 80% Off on Smartphones, Laptops, ANC Headphones & Gaming gear. Deals expire tonight!", link: "Electronics", active: true },
  { id: "b2", image: "https://picsum.photos/seed/bannerfashion/1200/500", title: "Premium Fashion Blowout Sale", subtitle: "Flat 70-80% off on Red Tape, Adidas, Levis & Premium Georgette Sets. Explore now!", link: "Fashion", active: true },
  { id: "b3", image: "https://picsum.photos/seed/bannerassistant/1200/500", title: "Meet Deal AI - Your Personal Smart Shopper", subtitle: "Ask budget recommendations, compare multiple platforms instantly, and get Tamil/Hindi search queries solved!", link: "Mobiles", active: true }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "iPhone 15 Pro Price Drop!", message: "Apple iPhone 15 Pro Natural Titanium has dropped to a historic low of ₹1,12,990 on Amazon! Buy before stock runs out.", date: "2026-07-18T10:00:00Z", read: false, type: "price_drop" },
  { id: "n2", title: "New Amazon Coupon Active", message: "Use coupon AMZELECT10 at Amazon checkout to save an extra 10% on over-ear ANC Headphones.", date: "2026-07-17T14:30:00Z", read: true, type: "coupon" },
  { id: "n3", title: "Flash Deals Live!", message: "Super low-price deals in Footwear and Fashion are live on Meesho and Shopsy. Limited quantities available.", date: "2026-07-18T08:00:00Z", read: false, type: "deal" }
];

const DEFAULT_USER: UserProfile = {
  email: "tthivashthivash@gmail.com",
  name: "Thivash Kumar",
  avatar: "https://picsum.photos/seed/useravatar/200/200",
  wishlist: ["p1", "p4", "p6"],
  savedDeals: ["p1", "p3"],
  recentlyViewed: ["p1", "p2", "p4", "p5"],
  notifications: ["n1", "n3"],
  role: "user" // Role-Based Access Control: default to user
};

interface UserProfileSecure extends UserProfile {
  passwordHash: string;
}

// Database structure
interface DataStore {
  products: Product[];
  coupons: Coupon[];
  banners: Banner[];
  notifications: Notification[];
  users: UserProfileSecure[];
}

// Active session tokens store
const SESSIONS_FILE = path.join(process.cwd(), "active_sessions.json");

function loadSessions(): Record<string, string> {
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }
  return {};
}

function saveSessions(sessions: Record<string, string>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save sessions", e);
  }
}

const activeSessions: { [token: string]: string } = loadSessions();

// Load database from file or seed default
function loadStore(): DataStore {
  let store: any = null;
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      store = JSON.parse(content);
    } catch (e) {
      console.error("Error reading data_store.json, resetting to defaults", e);
    }
  }

  if (!store) {
    store = {
      products: DEFAULT_PRODUCTS,
      coupons: DEFAULT_COUPONS,
      banners: DEFAULT_BANNERS,
      notifications: DEFAULT_NOTIFICATIONS,
      users: []
    };
  }

  // Legacy field migrations
  if (!store.users) {
    store.users = [];
  }

  // Predefined secure Admin account creation
  const hasAdmin = store.users.some((u: any) => u.email === "admin@dealverse.com");
  if (!hasAdmin) {
    store.users.push({
      email: "admin@dealverse.com",
      name: "DealVerse Admin",
      avatar: "https://picsum.photos/seed/adminavatar/200/200",
      wishlist: [],
      savedDeals: [],
      recentlyViewed: [],
      notifications: [],
      role: "user",
      passwordHash: "AdminPass123!" // separate predefined admin account
    });
  }

  // Handle conversion of single-user data
  if (store.user) {
    const hasOldUser = store.users.some((u: any) => u.email === store.user.email);
    if (!hasOldUser) {
      store.users.push({
        ...store.user,
        role: "user", // Normal users must automatically receive the role "user"
        passwordHash: "UserPass123!"
      });
    }
    delete store.user;
    saveStore(store);
  }

  // Enforce absolute email role integrity: ONLY thhivashthivash@gmail.com and tthivashthivash@gmail.com are super_admin, all others user
  let storeChanged = false;
  store.users.forEach((u: any) => {
    const isSuper = isSuperAdminEmail(u.email);
    const expectedRole = isSuper ? "super_admin" : "user";
    if (u.role !== expectedRole) {
      u.role = expectedRole;
      storeChanged = true;
    }
  });

  if (storeChanged) {
    saveStore(store);
  }

  return store as DataStore;
}

function isSuperAdminEmail(email: string): boolean {
  if (!email) return false;
  const norm = email.toLowerCase().trim();
  return (
    norm === "tthivash@gmail.com" ||
    norm === "tthivashthivash@gmail.com" ||
    norm === "thhivashthivash@gmail.com"
  );
}

function saveStore(store: DataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to data_store.json", e);
  }
}

function assignSuperAdminIfNoAdmin(store: DataStore, email: string) {
  let changed = false;
  store.users.forEach((u: any) => {
    const isSuper = isSuperAdminEmail(u.email);
    const expectedRole = isSuper ? "super_admin" : "user";
    if (u.role !== expectedRole) {
      u.role = expectedRole;
      changed = true;
    }
  });
  if (changed) {
    saveStore(store);
  }
}

// Authentication & RBAC Middlewares
const authenticateUser = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Access Denied. No session token provided." });
  }
  const token = authHeader.substring(7);
  const email = activeSessions[token];
  if (!email) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session." });
  }

  const store = loadStore();
  const user = store.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Session user no longer exists." });
  }

  req.user = user;
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !isSuperAdminEmail(req.user.email)) {
    return res.status(403).json({ error: "Forbidden: Super Admin authorization required." });
  }
  next();
};

// API Routes

// 0. Authentication Routes
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields (name, email, password) are required." });
  }
  const store = loadStore();
  const exists = store.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const newUser: UserProfileSecure = {
    name,
    email: email.toLowerCase(),
    avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/200/200`,
    wishlist: [],
    savedDeals: [],
    recentlyViewed: [],
    notifications: [],
    role: "user", // "Do NOT make the first registered user an admin. All other users must automatically receive the role 'user'."
    passwordHash: password
  };

  store.users.push(newUser);
  saveStore(store);

  assignSuperAdminIfNoAdmin(store, newUser.email);
  // Re-fetch user to get the newly updated role if changed
  const createdUser = store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || newUser;

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  activeSessions[token] = createdUser.email;
  saveSessions(activeSessions);

  const { passwordHash, ...userProfile } = createdUser;
  res.status(201).json({ token, user: userProfile });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const store = loadStore();
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  assignSuperAdminIfNoAdmin(store, user.email);
  const updatedUser = store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || user;

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  activeSessions[token] = updatedUser.email;
  saveSessions(activeSessions);

  const { passwordHash, ...userProfile } = updatedUser;
  res.json({ token, user: userProfile });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const store = loadStore();
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with this email." });
  }
  // Simulated OTP generation
  res.json({ success: true, message: "A verification OTP has been generated.", otp: "123456" });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }
  if (otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP code." });
  }

  const store = loadStore();
  const idx = store.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) {
    return res.status(404).json({ error: "User not found." });
  }

  if (newPassword) {
    store.users[idx].passwordHash = newPassword;
    saveStore(store);
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  activeSessions[token] = store.users[idx].email;
  saveSessions(activeSessions);

  const { passwordHash, ...userProfile } = store.users[idx];
  res.json({ token, user: userProfile });
});

function getRedirectUri() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const base = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  return `${base}/auth/callback`;
}

app.get("/api/auth/google/url", (req, res) => {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  if (!client_id) {
    return res.status(500).json({ 
      error: "Google Client ID is not configured. Please add GOOGLE_CLIENT_ID to environment variables in your Settings panel." 
    });
  }
  const redirect_uri = getRedirectUri();
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account"
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_FAILURE", error: ${JSON.stringify(error)} }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
          <p>Authentication failed: ${error}</p>
        </body>
      </html>
    `);
  }
  if (!code) {
    return res.status(400).send("No authorization code provided.");
  }

  try {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      throw new Error("Google OAuth credentials are not fully configured in your environment variables.");
    }

    const redirect_uri = getRedirectUri();

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code as string,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    // Fetch user profile info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to retrieve user info from Google.");
    }

    const userData = await userResponse.json() as any;
    const email = userData.email;
    const name = userData.name || "Google User";
    const avatar = userData.picture || `https://picsum.photos/seed/${encodeURIComponent(email)}/200/200`;

    if (!email) {
      throw new Error("Email was not returned by Google login.");
    }

    const store = loadStore();
    let user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const isSuper = isSuperAdminEmail(email);
    const expectedRole = isSuper ? "super_admin" : "user";

    if (!user) {
      user = {
        name,
        email: email.toLowerCase(),
        avatar,
        wishlist: [],
        savedDeals: [],
        recentlyViewed: [],
        notifications: [],
        role: expectedRole,
        passwordHash: `google_sso_${Date.now()}`
      };
      store.users.push(user);
      saveStore(store);
    } else {
      let updated = false;
      if (user.role !== expectedRole) {
        user.role = expectedRole;
        updated = true;
      }
      if (user.name !== name && name) {
        user.name = name;
        updated = true;
      }
      if (user.avatar !== avatar && avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        saveStore(store);
      }
    }

    // Force verify absolute email role integrity for all users in the DB
    let storeChanged = false;
    store.users.forEach((u: any) => {
      const isUserSuper = isSuperAdminEmail(u.email);
      const expRole = isUserSuper ? "super_admin" : "user";
      if (u.role !== expRole) {
        u.role = expRole;
        storeChanged = true;
      }
    });
    if (storeChanged) {
      saveStore(store);
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    activeSessions[token] = email.toLowerCase();
    saveSessions(activeSessions);

    const { passwordHash, ...userProfile } = user;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "OAUTH_AUTH_SUCCESS",
                token: ${JSON.stringify(token)},
                user: ${JSON.stringify(userProfile)}
              }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
          <p>Google login successful. You can close this window now.</p>
        </body>
      </html>
    `);

  } catch (e: any) {
    console.error("Google OAuth error inside callback:", e);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "OAUTH_AUTH_FAILURE",
                error: ${JSON.stringify(e.message || "Unknown error during Google authentication")}
              }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
          <p>Authentication error: ${e.message}</p>
        </body>
      </html>
    `);
  }
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    delete activeSessions[token];
    saveSessions(activeSessions);
  }
  res.json({ success: true });
});

// 1. Products API
app.get("/api/deals", authenticateUser, (req, res) => {
  const store = loadStore();
  let result = [...store.products];

  // Optional simple filters
  const { category, search, tag } = req.query;

  if (category) {
    result = result.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (tag) {
    result = result.filter(p => p.tags.some(t => t.toLowerCase() === (tag as string).toLowerCase()));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.platform.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

// Single Product detail
app.get("/api/deals/:id", authenticateUser, (req, res) => {
  const store = loadStore();
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  // Increment view count dynamically
  product.views += 1;
  saveStore(store);
  res.json(product);
});

// Create Deal (Admin Only)
app.post("/api/deals", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const newProduct: Product = {
    ...req.body,
    id: `p_${Date.now()}`,
    views: 0,
    shares: 0,
    priceHistory: [
      { date: "Current", price: req.body.offerPrice }
    ],
    reviews: [],
    createdAt: new Date().toISOString()
  };
  store.products.unshift(newProduct);
  saveStore(store);
  res.status(201).json(newProduct);
});

// Edit Deal (Admin Only)
app.put("/api/deals/:id", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const idx = store.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const oldProd = store.products[idx];
  
  // Track price history changes if price is updated
  let updatedHistory = [...oldProd.priceHistory];
  if (oldProd.offerPrice !== req.body.offerPrice) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const dateStr = `${months[now.getMonth()]} ${now.getFullYear()}`;
    updatedHistory.push({ date: dateStr, price: req.body.offerPrice });
  }

  const updatedProduct: Product = {
    ...oldProd,
    ...req.body,
    priceHistory: updatedHistory
  };
  store.products[idx] = updatedProduct;
  saveStore(store);
  res.json(updatedProduct);
});

// Delete Deal (Admin Only)
app.delete("/api/deals/:id", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const initialLen = store.products.length;
  store.products = store.products.filter(p => p.id !== req.params.id);
  if (store.products.length === initialLen) {
    return res.status(404).json({ error: "Product not found" });
  }
  saveStore(store);
  res.json({ success: true });
});

// 2. Coupons API
app.get("/api/coupons", authenticateUser, (req, res) => {
  const store = loadStore();
  res.json(store.coupons);
});

app.post("/api/coupons", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const newCoupon: Coupon = {
    ...req.body,
    id: `c_${Date.now()}`,
    active: true
  };
  store.coupons.push(newCoupon);
  saveStore(store);
  res.status(201).json(newCoupon);
});

app.delete("/api/coupons/:id", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  store.coupons = store.coupons.filter(c => c.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// 3. Banners API
app.get("/api/banners", authenticateUser, (req, res) => {
  const store = loadStore();
  res.json(store.banners);
});

app.post("/api/banners", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const newBanner: Banner = {
    ...req.body,
    id: `b_${Date.now()}`,
    active: true
  };
  store.banners.push(newBanner);
  saveStore(store);
  res.status(201).json(newBanner);
});

app.delete("/api/banners/:id", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  store.banners = store.banners.filter(b => b.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// 4. Notifications API
app.get("/api/notifications", authenticateUser, (req, res) => {
  const store = loadStore();
  res.json(store.notifications);
});

app.post("/api/notifications", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const newNotif: Notification = {
    id: `n_${Date.now()}`,
    title: req.body.title,
    message: req.body.message,
    type: req.body.type || "deal",
    date: new Date().toISOString(),
    read: false
  };
  store.notifications.unshift(newNotif);
  saveStore(store);
  res.status(201).json(newNotif);
});

app.put("/api/notifications/:id/read", authenticateUser, (req, res) => {
  const store = loadStore();
  const notif = store.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveStore(store);
  }
  res.json({ success: true });
});

// 5. User Account / Profile & Preferences API
app.get("/api/profile", authenticateUser, (req: any, res) => {
  res.json(req.user);
});

app.put("/api/profile", authenticateUser, (req: any, res) => {
  const store = loadStore();
  const idx = store.users.findIndex(u => u.email === req.user.email);
  if (idx !== -1) {
    store.users[idx] = {
      ...store.users[idx],
      ...req.body,
      role: store.users[idx].role // Enforce RBAC: prevent role escalation
    };
    saveStore(store);
    res.json(store.users[idx]);
  } else {
    res.status(404).json({ error: "User profile not found." });
  }
});

app.post("/api/profile/wishlist/:id", authenticateUser, (req: any, res) => {
  const store = loadStore();
  const id = req.params.id;
  const idx = store.users.findIndex(u => u.email === req.user.email);
  if (idx !== -1) {
    const user = store.users[idx];
    if (!user.wishlist) user.wishlist = [];
    if (!user.wishlist.includes(id)) {
      user.wishlist.push(id);
    } else {
      user.wishlist = user.wishlist.filter(item => item !== id);
    }
    saveStore(store);
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

app.post("/api/profile/recently-viewed/:id", authenticateUser, (req: any, res) => {
  const store = loadStore();
  const id = req.params.id;
  const idx = store.users.findIndex(u => u.email === req.user.email);
  if (idx !== -1) {
    const user = store.users[idx];
    if (!user.recentlyViewed) user.recentlyViewed = [];
    user.recentlyViewed = user.recentlyViewed.filter(item => item !== id);
    user.recentlyViewed.unshift(id);
    if (user.recentlyViewed.length > 8) {
      user.recentlyViewed.pop();
    }
    saveStore(store);
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

app.post("/api/profile/save-deal/:id", authenticateUser, (req: any, res) => {
  const store = loadStore();
  const id = req.params.id;
  const idx = store.users.findIndex(u => u.email === req.user.email);
  if (idx !== -1) {
    const user = store.users[idx];
    if (!user.savedDeals) user.savedDeals = [];
    if (!user.savedDeals.includes(id)) {
      user.savedDeals.push(id);
    } else {
      user.savedDeals = user.savedDeals.filter(item => item !== id);
    }
    saveStore(store);
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

// 6. Analytics API for Admin Panel (Admin Only)
app.get("/api/analytics", authenticateUser, requireAdmin, (req, res) => {
  const store = loadStore();
  const totalProducts = store.products.length;
  const totalViews = store.products.reduce((acc, p) => acc + p.views, 0);
  const totalClicks = Math.floor(totalViews * 0.42); // simulated affiliate click conversion (42% of views)
  const totalCoupons = store.coupons.length;

  // Category distribution
  const catMap: { [key: string]: number } = {};
  store.products.forEach(p => {
    catMap[p.category] = (catMap[p.category] || 0) + 1;
  });
  const categoryDistribution = Object.keys(catMap).map(name => ({
    name,
    value: catMap[name]
  }));

  // Platform distribution
  const platMap: { [key: string]: number } = {};
  store.products.forEach(p => {
    platMap[p.platform] = (platMap[p.platform] || 0) + 1;
  });
  const platformDistribution = Object.keys(platMap).map(name => ({
    name,
    value: platMap[name]
  }));

  // Views History (7 Days)
  const viewsHistory = [
    { date: "Mon", views: Math.floor(totalViews * 0.1) },
    { date: "Tue", views: Math.floor(totalViews * 0.12) },
    { date: "Wed", views: Math.floor(totalViews * 0.15) },
    { date: "Thu", views: Math.floor(totalViews * 0.13) },
    { date: "Fri", views: Math.floor(totalViews * 0.18) },
    { date: "Sat", views: Math.floor(totalViews * 0.22) },
    { date: "Sun", views: Math.floor(totalViews * 0.1) }
  ];

  const analytics: DashboardAnalytics = {
    totalProducts,
    totalViews,
    totalClicks,
    totalCoupons,
    categoryDistribution,
    platformDistribution,
    viewsHistory
  };

  res.json(analytics);
});

// Add Review Endpoint
app.post("/api/deals/:id/reviews", authenticateUser, (req, res) => {
  const store = loadStore();
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const { user, rating, comment } = req.body;
  const newReview = {
    id: `r_${Date.now()}`,
    user: user || "Anonymous",
    rating: Number(rating) || 5,
    comment: comment || "",
    date: new Date().toISOString().split("T")[0]
  };

  product.reviews.unshift(newReview);
  // Recalculate rating
  const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
  product.ratings = parseFloat((totalRating / product.reviews.length).toFixed(1));

  saveStore(store);
  res.status(201).json(newReview);
});

// 7. Gemini Chatbot Integration
app.post("/api/gemini/chat", authenticateUser, async (req, res) => {
  const { messages, language } = req.body; // messages: { role: "user"|"model", content: string }[]
  const store = loadStore();

  // Extract deals data to give Gemini high-context grounding
  const dealsContext = store.products.map(p => ({
    id: p.id,
    name: p.name,
    mrp: p.mrp,
    offerPrice: p.offerPrice,
    discount: p.discount,
    platform: p.platform,
    category: p.category,
    description: p.description,
    link: `/product/${p.id}`,
    stock: p.stockStatus
  }));

  const couponsContext = store.coupons.map(c => ({
    code: c.code,
    platform: c.platform,
    discount: c.discountText,
    description: c.description
  }));

  const systemInstruction = `You are Deal AI, an elegant, helpful, and premium 24x7 AI Shopping Assistant for the "DealVerse" platform.
Your purpose is to help users browse deals, find coupons, compare prices, suggest budget recommendations, and answer shopping questions.

Here is the REAL, LIVE database of products uploaded by our admin at DealVerse:
${JSON.stringify(dealsContext, null, 2)}

And here are our active Coupons:
${JSON.stringify(couponsContext, null, 2)}

User's preferred language is: ${language || "English"}.
Respond in ${language || "English"} (or Tamil (தமிழ்) or Hindi (हिंदी) based on user's preference).
Be warm, professional, extremely concise, and helpful. Always recommend REAL deals from the active database listed above if they match the user's criteria. Mention the platform (e.g., Amazon, Flipkart, Meesho) and explain the discount percentage to prove how great the deal is.
When recommending a deal, format the suggestion beautifully. Highlight the offer price, MRP, and savings. Offer to help them buy it!`;

  if (aiClient) {
    try {
      // Build history for Gemini format: contents
      // Gemini chats sendMessage or generateContent. Let's use ai.models.generateContent which is solid.
      const conversationHistory = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const lastUserMessage = messages[messages.length - 1]?.content || "Hello";

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...conversationHistory.slice(0, -1),
          { role: "user", parts: [{ text: lastUserMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "I am here to find the best shopping deals for you! Let me know what you are looking for.";
      res.json({ reply });
    } catch (err: any) {
      console.error("Gemini AI API Error:", err);
      res.status(500).json({ 
        reply: "Sorry, I am facing a minor connection issue right now. Here is a friendly shopping suggestion: Check out our featured Apple iPhone 15 Pro at ₹1,12,990 on Amazon (16% off!) or the OnePlus 12R on Flipkart! How can I assist you otherwise?",
        error: err.message 
      });
    }
  } else {
    // Quality rule-based fallback when GEMINI_API_KEY is not defined
    const query = (messages[messages.length - 1]?.content || "").toLowerCase();
    let reply = "";

    if (query.includes("iphone") || query.includes("apple") || query.includes("phone") || query.includes("mobile")) {
      reply = "Our top mobile deal is the **Apple iPhone 15 Pro** on **Amazon**! It's currently selling for **₹1,12,990** (MRP: ₹1,34,900), giving you a **16% flat discount**. We also have the **OnePlus 12R** on **Flipkart** for **₹39,999** (13% off). Would you like me to compare their features or find coupons for them?";
    } else if (query.includes("headphone") || query.includes("earphone") || query.includes("sony") || query.includes("audio")) {
      reply = "You can save big on the **Sony WH-1000XM5 ANC Headphones** on **Amazon**! The price is slashed by **22%** down to **₹26,990** (MRP: ₹34,990). You can also use coupon **AMZELECT10** at checkout for extra savings!";
    } else if (query.includes("fashion") || query.includes("clothes") || query.includes("kurta") || query.includes("dress")) {
      reply = "We have an incredible fashion deal: the **Premium Embroidered Georgette Anarkali Kurta Set** on **Meesho** for just **₹799** (MRP: ₹3,299), which is a huge **75% discount**! Perfect for festive occasions. For men, the **Red Tape Retro Sneakers** are on Myntra for **₹1,399** (74% discount).";
    } else if (query.includes("coupon") || query.includes("code") || query.includes("discount")) {
      reply = "Here are our active coupon codes:\n1. **AMZELECT10**: Flat 10% off on Amazon premium audio\n2. **FKFASH200**: Save ₹200 extra on Flipkart Retro Sneakers\n3. **MEESHONEW**: 20% off for new users on Meesho\n4. **AJIOSELECT**: Extra 15% off on Ajio watches\nSimply copy these and apply them on the original platform!";
    } else if (query.includes("tamil") || query.includes("தமிழ்") || query.includes("வணக்கம்")) {
      reply = "வணக்கம்! நான் டீல் ஏஐ (Deal AI). டீல்வர்ஸ் (DealVerse) தளம் மூலம் சிறந்த சலுகைகளை அறிய நான் உங்களுக்கு உதவுகிறேன். உங்களுக்கு மொபைல் போன்கள், ஆடைகள் அல்லது எலக்ட்ரானிக்ஸ் ஆகியவற்றில் என்ன டீல் வேண்டும்?";
    } else if (query.includes("hindi") || query.includes("हिंदी") || query.includes("नमस्ते")) {
      reply = "नमस्ते! मैं डील एआई (Deal AI) हूँ। डीलवर्स (DealVerse) पर सबसे सस्ते और बढ़िया ऑफर्स ढूंढने में मैं आपकी सहायता कर सकता हूँ। क्या आप आज के सबसे लोकप्रिय ऑफर्स देखना चाहते हैं?";
    } else {
      reply = "Welcome to DealVerse! I am Deal AI, your smart 24x7 Assistant. I can help you find the absolute lowest prices, recommend products across Mobiles, Fashion, and Electronics, calculate budget savings, and provide coupon codes! What are you shopping for today?";
    }

    res.json({ reply });
  }
});

// Vite Setup / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
