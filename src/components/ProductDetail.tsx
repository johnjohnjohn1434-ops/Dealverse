import React, { useState, useEffect } from "react";
import { 
  X, Heart, Share2, Bell, AlertCircle, Copy, Check, Star, ExternalLink, 
  ChevronLeft, ChevronRight, ShieldCheck, Tag, Info, ThumbsUp 
} from "lucide-react";
import { Product, Review, Coupon } from "../types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onToggleSaveDeal: (id: string) => void;
  savedDeals: string[];
  relatedProducts: Product[];
  onSelectProduct: (id: string) => void;
  token: string | null;
}

export default function ProductDetail({
  productId,
  onClose,
  wishlist,
  onToggleWishlist,
  onToggleSaveDeal,
  savedDeals,
  relatedProducts,
  onSelectProduct,
  token
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertPrice, setAlertPrice] = useState<number>(0);
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Review Form State
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Coupons state loaded from platform matching
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Fetch product detail on id change
  useEffect(() => {
    setLoading(true);
    setAlertSubscribed(false);
    setReviewSuccess(false);
    
    // Fetch product details
    fetch(`/api/deals/${productId}`, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product");
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        setActiveImage(data.image);
        setAlertPrice(Math.floor(data.offerPrice * 0.95)); // set default threshold to 5% drop
        setLoading(false);

        // Fetch coupons for this platform
        fetch("/api/coupons", {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        })
          .then((r) => r.json())
          .then((allCoupons: Coupon[]) => {
            const matched = allCoupons.filter(
              (c) => c.platform.toLowerCase() === data.platform.toLowerCase()
            );
            setCoupons(matched);
          });

        // Track recently viewed
        fetch(`/api/profile/recently-viewed/${data.id}`, { 
          method: "POST",
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [productId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-3xl bg-white p-8 shadow-2xl max-w-sm w-full text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Fetching premium deal details...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Image Zoom math
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleCopyShare = () => {
    const textToCopy = `🔥 HOT DEAL: ${product.name} is on sale for ₹${product.offerPrice.toLocaleString()} (${product.discount}% off) on ${product.platform}! Check it out here: ${product.affiliateLink}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSubscribeAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) return;
    
    // In production this would send to server, we'll simulate success
    setAlertSubscribed(true);
    // Log alert to admin notifications
    fetch("/api/notifications", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        title: "Price Alert Registered",
        message: `User ${alertEmail} requested an alert for ${product.name} when price drops below ₹${alertPrice.toLocaleString()}.`,
        type: "system"
      })
    });
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    try {
      const res = await fetch(`/api/deals/${product.id}/reviews`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user: reviewerName,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        const addedReview = await res.json();
        setProduct((prev) => {
          if (!prev) return null;
          const updatedReviews = [addedReview, ...prev.reviews];
          const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
          return {
            ...prev,
            reviews: updatedReviews,
            ratings: parseFloat((totalRating / updatedReviews.length).toFixed(1))
          };
        });
        setReviewerName("");
        setReviewComment("");
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isProductWishlisted = wishlist.includes(product.id);
  const isProductSaved = savedDeals.includes(product.id);

  const getPlatformBg = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "amazon": return "bg-[#ff9900]/10 text-[#ff9900]";
      case "flipkart": return "bg-[#2874f0]/10 text-[#2874f0]";
      case "meesho": return "bg-[#f43f5e]/10 text-[#f43f5e]";
      case "myntra": return "bg-[#ec4899]/10 text-[#ec4899]";
      case "ajio": return "bg-[#1e293b]/10 text-[#1e293b]";
      default: return "bg-blue-50 text-blue-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 md:p-10">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:px-6 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPlatformBg(product.platform)}`}>
              {product.platform} Deal
            </span>
            <span className="text-xs text-gray-400 font-mono">Views: {product.views}</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full bg-white border border-gray-200 p-2 text-gray-500 hover:text-gray-800 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Gallery & Zoom */}
            <div className="md:col-span-5 space-y-4">
              <div 
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 h-80 sm:h-96 flex items-center justify-center cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={activeImage}
                  alt={product.name}
                  className={`max-h-full max-w-full object-contain p-4 transition-transform duration-200 ${
                    isZoomed ? "opacity-0" : "scale-100"
                  }`}
                  referrerPolicy="no-referrer"
                />
                
                {/* Zoom layer */}
                {isZoomed && (
                  <div
                    className="absolute inset-0 bg-no-repeat p-4"
                    style={{
                      backgroundImage: `url(${activeImage})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: "200%",
                      backgroundColor: "#f9fafb"
                    }}
                  />
                )}

                {/* Discount Tag */}
                <div className="absolute top-4 left-4 bg-orange-500 text-white font-black text-sm px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {product.discount}% OFF
                </div>
              </div>

              {/* Thumbnails */}
              {product.gallery && product.gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`h-16 w-20 flex-shrink-0 rounded-lg border-2 p-1 bg-white hover:scale-105 transition-all cursor-pointer ${
                        activeImage === img ? "border-blue-600 shadow-md" : "border-gray-200"
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Info & Actions */}
            <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-1 border-y border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 font-semibold">
                    <span className="flex items-center gap-0.5 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Star className="h-3 w-3 fill-white" /> {product.ratings}
                    </span>
                    <span>({product.reviews.length} Customer reviews)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleWishlist(product.id)}
                      className={`rounded-xl border p-2.5 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                        isProductWishlisted
                          ? "border-pink-200 bg-pink-50 text-pink-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isProductWishlisted ? "fill-pink-600 text-pink-600" : ""}`} />
                      {isProductWishlisted ? "Wishlisted" : "Wishlist"}
                    </button>

                    <button
                      onClick={() => onToggleSaveDeal(product.id)}
                      className={`rounded-xl border p-2.5 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                        isProductSaved
                          ? "border-blue-200 bg-blue-50 text-blue-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <ShieldCheck className={`h-4 w-4 ${isProductSaved ? "fill-blue-600" : ""}`} />
                      {isProductSaved ? "Saved Deal" : "Save"}
                    </button>

                    <button
                      onClick={handleCopyShare}
                      className="rounded-xl border border-gray-200 hover:bg-gray-50 p-2.5 text-gray-600 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      {copiedShare ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Price Box */}
                <div className="bg-gradient-to-r from-blue-50/60 to-orange-50/60 rounded-2xl p-5 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Offer Price</span>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <span className="text-3xl font-black text-gray-900">₹{product.offerPrice.toLocaleString()}</span>
                      <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-green-600 font-bold mt-1">
                      You save ₹{(product.mrp - product.offerPrice).toLocaleString()} ({product.discount}% off)
                    </p>
                  </div>

                  <a
                    href={product.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase cursor-pointer"
                  >
                    Buy Now on {product.platform}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Coupon Code Section */}
                {product.couponCode && (
                  <div className="border border-dashed border-orange-300 rounded-xl bg-orange-50/40 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500 text-white p-2 rounded-lg">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Exclusive Coupon Code</span>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-gray-800 text-sm">{product.couponCode}</p>
                          <span className="text-xs bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                            {product.couponDiscount || "Flat Discount"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(product.couponCode!)}
                      className="px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedCoupon ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCoupon ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm">Product Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Price Comparison & Coupons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Price drop alert registration */}
            <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-br from-blue-50/30 to-white">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-2">
                <Bell className="h-4 w-4 text-blue-600 animate-swing" /> Price Drop Alert
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Want this deal even cheaper? Enter your email and targeted budget below. We will ping you instantly via email/notifications when it hits or drops below your target!
              </p>
              
              {alertSubscribed ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Alert Set Successfully!</span>
                    We will notify you at <strong className="font-semibold">{alertEmail}</strong> when price drops below <strong>₹{alertPrice.toLocaleString()}</strong>.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribeAlert} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Target Price</label>
                      <input
                        type="number"
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(Number(e.target.value))}
                        max={product.offerPrice}
                        className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Activate Alert
                  </button>
                </form>
              )}
            </div>

            {/* Coupons Finder list */}
            <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-br from-orange-50/20 to-white">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-2">
                <Tag className="h-4 w-4 text-orange-500" /> Coupons Finder
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                We scanned the web for extra saving coupons matching {product.platform}:
              </p>

              <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                {coupons.length > 0 ? (
                  coupons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl bg-white shadow-sm">
                      <div>
                        <span className="font-mono text-xs font-bold text-gray-800 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{c.description}</p>
                      </div>
                      <button
                        onClick={() => handleCopyCoupon(c.code)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400">No active coupons found for {product.platform}. Use Deal AI below to search online!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Price History Chart */}
          <div className="border border-gray-100 rounded-2xl p-5 sm:p-6 bg-white space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600" /> Price History Trend
                </h3>
                <p className="text-xs text-gray-500">Track price drops to verify how genuine this offer is!</p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                ★ Guaranteed Lowest price this week
              </span>
            </div>

            {/* Price Chart Container */}
            <div className="h-48 w-full font-mono text-xs pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={product.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" tickLine={false} />
                  <YAxis 
                    stroke="#9ca3af" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Price"]} 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: "#ea580c" }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section: Specifications */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Product Specifications</h3>
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <tbody>
                  {product.specs.map((spec, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
                      <td className="px-4 py-3 font-semibold text-gray-600 w-1/3 border-b border-gray-100/50">{spec.key}</td>
                      <td className="px-4 py-3 text-gray-800 border-b border-gray-100/50">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Community Reviews */}
          <div className="border-t border-gray-100 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base">Deals Community Reviews ({product.reviews.length})</h3>
              <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-white" />
                {product.ratings} Rating
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Form to submit review */}
              <div className="md:col-span-5 bg-gray-50/70 rounded-2xl p-5 border border-gray-100/60 h-fit">
                <h4 className="font-bold text-gray-800 text-xs uppercase mb-3 tracking-wider">Leave a Review</h4>
                {reviewSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs">
                    <span className="font-bold block mb-1">Review Shared!</span>
                    Thank you for sharing your experience with this DealVerse product.
                  </div>
                ) : (
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Rating</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <Star className={`h-5 w-5 ${reviewRating >= star ? "fill-amber-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Comment</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="I bought this and saved money! Highly recommended..."
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-extrabold text-xs rounded-xl shadow uppercase tracking-wider cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews List */}
              <div className="md:col-span-7 space-y-4 max-h-[340px] overflow-y-auto pr-2">
                {product.reviews.length > 0 ? (
                  product.reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                            {r.user.substring(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 text-xs block">{r.user}</span>
                            <span className="text-[10px] text-gray-400 block">{r.date}</span>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${r.rating >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-semibold">No reviews yet. Be the first to share your purchase saving story!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Similar Money Saving Deals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProduct(p.id)}
                    className="group border border-gray-100 hover:border-blue-200 hover:shadow-lg bg-white p-3.5 rounded-2xl text-left transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-fit"
                  >
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${getPlatformBg(p.platform)} px-1.5 py-0.5 rounded`}>
                        {p.platform}
                      </span>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 pt-1 group-hover:text-blue-600">
                        {p.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-sm font-black text-gray-900">₹{p.offerPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-green-600 font-extrabold">{p.discount}% OFF</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
