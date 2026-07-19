export type Platform = "Meesho" | "Shopsy" | "Flipkart" | "Amazon" | "Myntra" | "Ajio";

export interface Spec {
  key: string;
  value: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  mrp: number;
  offerPrice: number;
  discount: number;
  platform: Platform;
  affiliateLink: string;
  category: string;
  image: string;
  gallery: string[];
  stockStatus: "In Stock" | "Out of Stock" | "Low Stock";
  tags: string[]; // e.g., ["Featured", "Trending", "Flash Sale", "Lowest Price"]
  specs: Spec[];
  priceHistory: PricePoint[];
  ratings: number;
  reviews: Review[];
  views: number;
  shares: number;
  couponCode?: string;
  couponDiscount?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  platform: Platform;
  discountText: string;
  expiryDate: string;
  active: boolean;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  wishlist: string[]; // array of product IDs
  savedDeals: string[]; // array of product IDs
  recentlyViewed: string[]; // array of product IDs
  notifications: string[]; // array of notification IDs
  role: "super_admin" | "admin" | "user";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "price_drop" | "coupon" | "deal" | "system";
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  active: boolean;
}

export interface DashboardAnalytics {
  totalProducts: number;
  totalViews: number;
  totalClicks: number;
  totalCoupons: number;
  categoryDistribution: { name: string; value: number }[];
  platformDistribution: { name: string; value: number }[];
  viewsHistory: { date: string; views: number }[];
}
