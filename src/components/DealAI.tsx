import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Languages, 
  ChevronRight, Flame, Percent, Cpu, Activity, TrendingUp, AlertCircle, ShoppingBag, Grid
} from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface Product {
  id: string;
  name: string;
  mrp: number;
  offerPrice: number;
  discount: number;
  category: string;
  platform: string;
  image: string;
  description: string;
  link: string;
  views: number;
  ratings: number;
  stockStatus: string;
}

interface Coupon {
  id: string;
  code: string;
  platform: string;
  discountText: string;
  description: string;
}

interface DealAIProps {
  onRecommendProduct: (productId: string) => void;
  token: string | null;
}

export default function DealAI({ onRecommendProduct, token }: DealAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Salutations, Human! 🌌 I am **Deal AI**, your highly intelligent cybernetic shopping companion. I have complete access to our real-time database to compare prices, unlock active promotional coupons, and guide you to premium savings across English, Tamil, and Hindi. What high-value asset can I find for you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [language, setLanguage] = useState<"English" | "Tamil" | "Hindi">("English");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // High-context DB caching for rich preview rendering
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbCoupons, setDbCoupons] = useState<Coupon[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Fetch products and coupons on mount or token changes to enable live inline rendering of cards
  useEffect(() => {
    if (!token) {
      setDbProducts([]);
      setDbCoupons([]);
      return;
    }

    fetch("/api/deals", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        } else {
          setDbProducts([]);
        }
      })
      .catch(e => {
        console.error("Error fetching AI products", e);
        setDbProducts([]);
      });

    fetch("/api/coupons", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbCoupons(data);
        } else {
          setDbCoupons([]);
        }
      })
      .catch(e => {
        console.error("Error fetching AI coupons", e);
        setDbCoupons([]);
      });
  }, [token]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      if (language === "Tamil") {
        rec.lang = "ta-IN";
      } else if (language === "Hindi") {
        rec.lang = "hi-IN";
      } else {
        rec.lang = "en-IN";
      }

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleSendMessage(text);
        }
        setIsVoiceActive(false);
      };

      rec.onerror = () => {
        setIsVoiceActive(false);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  // Speak response if not muted
  const speakResponse = (text: string) => {
    if (isMuted) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown syntax for natural voice
      const cleanedText = text
        .replace(/[\*#_`]/g, "")
        .replace(/₹/g, " Rupees ")
        .substring(0, 200); 

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      if (language === "Tamil") {
        utterance.lang = "ta-IN";
      } else if (language === "Hindi") {
        utterance.lang = "hi-IN";
      } else {
        utterance.lang = "en-IN";
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not fully supported in this iframe. Please open the app in a new tab or use Google Chrome for high-fidelity voice control.");
      return;
    }
    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      window.speechSynthesis.cancel(); 
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: newMessages, language })
      });
      const data = await response.json();
      
      const botResponse = { role: "model" as const, content: data.reply };
      setMessages(prev => [...prev, botResponse]);
      speakResponse(data.reply);

      // Scroll elegantly to recommendations if mentioned
      if (data.reply.includes("/product/")) {
        const match = data.reply.match(/\/product\/(p[a-zA-Z0-9_]*)/);
        if (match && match[1]) {
          onRecommendProduct(match[1]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const fallback = "System override active. Check out our **Apple iPhone 15 Pro** currently saving you **₹22,000 flat discount**! How can I redirect your sensors today?";
      setMessages(prev => [...prev, { role: "model", content: fallback }]);
      speakResponse(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortcutClick = (shortcut: string) => {
    handleSendMessage(shortcut);
  };

  // Structured search helpers to find references of database items in assistant bubbles
  const findReferencedProduct = (text: string) => {
    if (!Array.isArray(dbProducts)) return undefined;
    return dbProducts.find(p => 
      text.toLowerCase().includes(p.name.toLowerCase().substring(0, 15)) ||
      text.toLowerCase().includes(p.id.toLowerCase())
    );
  };

  const findReferencedCoupon = (text: string) => {
    if (!Array.isArray(dbCoupons)) return undefined;
    return dbCoupons.find(c => text.toUpperCase().includes(c.code.toUpperCase()));
  };

  const shortcuts = {
    English: [
      { label: "🔥 Deal Finder", prompt: "List the hot trending deals in the database with highest discounts." },
      { label: "🎟️ Coupon Lookup", prompt: "Show me all active coupons to copy." },
      { label: "📱 Compare Mobiles", prompt: "Compare the smartphones available in our database. Which is best?" },
      { label: "⚡ Flash Sales", prompt: "Are there any items under 80% discount or flash sale?" }
    ],
    Tamil: [
      { label: "🔥 சிறந்த சலுகைகள்", prompt: "அதிக சலுகை கொண்ட சிறந்த டீல்களை பட்டியலிடவும்." },
      { label: "🎟️ கூப்பன் குறியீடுகள்", prompt: "ஆக்டிவ் கூப்பன் குறியீடுகளைக் காட்டு." },
      { label: "📱 மொபைல் ஒப்பீடு", prompt: "மொபைல்களின் விலை மற்றும் தள்ளுபடி விவரங்களை ஒப்பிடவும்." },
      { label: "⚡ விரைவு தள்ளுபடி", prompt: "இன்றைய மிக மலிவான சிறந்த டீல்கள் என்ன?" }
    ],
    Hindi: [
      { label: "🔥 बेस्ट डील्स", prompt: "सबसे ज्यादा डिस्काउंट वाले ऑफर्स की लिस्ट दिखाएं।" },
      { label: "🎟️ एक्टिव कूपन्स", prompt: "सभी सक्रीय कूपन कोड्स की सूची प्रदान करें।" },
      { label: "📱 मोबाइल तुलना", prompt: "उपलब्ध स्मार्टफोन्स की कीमतों की तुलना करें।" },
      { label: "⚡ फ्लैश सेल", prompt: "आज के सबसे बड़े धमाका ऑफर्स कौन से हैं?" }
    ]
  };

  return (
    <>
      {/* 1. FUTURISTIC COLOR-SHIFTING FLOATING AI ORB (INACTIVE STATE) */}
      <motion.button
        id="deal-ai-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 via-blue-600 via-purple-600 to-pink-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:shadow-[0_0_45px_rgba(34,211,238,0.8)] cursor-pointer transition-all duration-500"
        whileHover={{ scale: 1.15, rotate: 12 }}
        whileTap={{ scale: 0.92 }}
        layoutId="ai-panel-container"
      >
        {/* Revolving cybernetic orbital dashed rings */}
        <div className="absolute inset-[-4px] rounded-full border border-dashed border-cyan-400/50 animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-[-8px] rounded-full border border-double border-pink-500/30 animate-[spin_15s_linear_infinite_reverse]"></div>
        
        {/* Soft breathing pulse glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 blur-sm opacity-60 animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-center">
          <Sparkles className="h-6.5 w-6.5 text-white animate-[bounce_2s_infinite]" />
        </div>

        {/* AI Tag badge */}
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex h-5 w-5 rounded-full bg-slate-900 border border-cyan-500/40 text-[9px] font-black text-cyan-400 items-center justify-center shadow-lg">AI</span>
        </span>
      </motion.button>

      {/* 2. CHAT PANEL (ACTIVE GLASSMORPHISM SECTOR) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="deal-ai-chatbox"
            initial={{ opacity: 0, scale: 0.9, y: 60, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 60, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[620px] w-[calc(100vw-2rem)] sm:w-[410px] flex-col rounded-3xl border border-white/10 bg-slate-950/85 text-white shadow-[0_0_50px_rgba(59,130,246,0.3)] backdrop-blur-2xl overflow-hidden font-sans"
          >
            {/* Cybernetic holographic background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40"></div>

            {/* HEADER BLOCK */}
            <div className="relative overflow-hidden border-b border-white/5 bg-slate-900/60 p-4.5">
              {/* Pulsing neon linear bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-[length:200%_auto] animate-gradient-shift"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  
                  {/* Rotating Holographic 3D AI Core Vector Avatar */}
                  <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] overflow-hidden">
                    <div className={`absolute inset-1.5 rounded-full border border-dashed border-cyan-400/40 ${isLoading ? "animate-[spin_2s_linear_infinite]" : "animate-[spin_8s_linear_infinite]"}`}></div>
                    <div className="absolute inset-3 rounded-full border border-pink-500/20 animate-[spin_4s_linear_infinite_reverse]"></div>
                    
                    {/* Inner core energy nodes */}
                    <div className="relative z-10 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-ping"></div>
                    <div className="absolute z-15 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"></div>
                  </div>

                  <div>
                    <h3 className="font-display font-black text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
                      DEAL AI CORE <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-black animate-pulse">SYSTEM ONLINE</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Quantum Shopping Companion</p>
                  </div>
                </div>

                {/* Top Action controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`rounded-full p-2 border transition-all cursor-pointer ${
                      isMuted ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-300"
                    }`}
                    title={isMuted ? "Unmute vocal synthesis" : "Mute vocal synthesis"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* LANGUAGE CONTROLLER BAR */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-950/90 text-[11px] font-semibold relative z-10">
              <span className="text-gray-400 flex items-center gap-1.5 font-mono">
                <Languages className="h-3.5 w-3.5 text-cyan-400" /> DIALECT_SELECT:
              </span>
              <div className="flex gap-1.5">
                {(["English", "Tamil", "Hindi"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-wide transition-all uppercase cursor-pointer ${
                      language === lang
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : "bg-slate-900 text-gray-400 border border-white/5 hover:bg-slate-800"
                    }`}
                  >
                    {lang === "Tamil" ? "தமிழ்" : lang === "Hindi" ? "हिंदी" : "EN"}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT CHRONICLES SECTOR */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 to-slate-900/40 relative z-10">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const referencedProduct = !isUser ? findReferencedProduct(msg.content) : null;
                const referencedCoupon = !isUser ? findReferencedCoupon(msg.content) : null;

                return (
                  <div key={index} className="space-y-2.5">
                    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg border ${
                          isUser
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-tr-none border-cyan-400/20 font-bold"
                            : "bg-slate-900/90 text-gray-200 rounded-tl-none border-white/10"
                        }`}
                      >
                        {/* Message textual display with custom markdown bold rendering */}
                        <div className="whitespace-pre-wrap">
                          {msg.content.split("\n").map((line, i) => {
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            const parts = [];
                            let lastIdx = 0;
                            let match;
                            while ((match = boldRegex.exec(line)) !== null) {
                              if (match.index > lastIdx) {
                                parts.push(line.substring(lastIdx, match.index));
                              }
                              parts.push(
                                <strong key={match.index} className={isUser ? "text-slate-950 font-black" : "text-cyan-400 font-extrabold"}>
                                  {match[1]}
                                </strong>
                              );
                              lastIdx = boldRegex.lastIndex;
                            }
                            if (lastIdx < line.length) {
                              parts.push(line.substring(lastIdx));
                            }
                            return <p key={i} className="mb-1">{parts.length > 0 ? parts : line}</p>;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE RICH PRODUCT CARD IF FOUND IN MODEL MESSAGE */}
                    {referencedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 max-w-[90%] mr-auto rounded-tl-none relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-bl-xl border-l border-b border-cyan-500/10">
                          AI Matched Deal
                        </div>
                        <div className="flex gap-3">
                          <img
                            src={referencedProduct.image}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover bg-white"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded">
                              {referencedProduct.platform}
                            </span>
                            <h4 className="text-[11px] font-bold text-white truncate">{referencedProduct.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-cyan-400">₹{referencedProduct.offerPrice.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{referencedProduct.mrp.toLocaleString()}</span>
                              <span className="text-[9px] font-black text-pink-400 bg-pink-500/10 px-1.5 py-0.2 rounded-full">
                                {referencedProduct.discount}% OFF
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRecommendProduct(referencedProduct.id)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-transform cursor-pointer shadow-md"
                        >
                          Telemetry Diagnostics & View Details
                        </button>
                      </motion.div>
                    )}

                    {/* INTERACTIVE COUPON CODE CARD IF REFERENCED */}
                    {referencedCoupon && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-slate-900/90 border border-pink-500/20 rounded-2xl p-3 shadow-xl max-w-[85%] mr-auto rounded-tl-none flex items-center justify-between gap-3 relative overflow-hidden"
                      >
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 uppercase font-mono">Platform coupon detected</p>
                          <h4 className="text-xs font-black text-pink-400">{referencedCoupon.discountText}</h4>
                          <p className="text-[10px] text-gray-300 font-semibold">{referencedCoupon.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(referencedCoupon.code);
                            alert(`Coupon Code ${referencedCoupon.code} copied!`);
                          }}
                          className="px-3 py-2 bg-pink-600 text-white font-mono font-black text-xs rounded-xl hover:bg-pink-700 cursor-pointer flex flex-col items-center leading-none"
                        >
                          <span className="text-[8px] uppercase font-sans tracking-wide">Code</span>
                          <span>{referencedCoupon.code}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* AI THINKING LOADING LOADER ANIMS */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-3">
                    {/* Pulsing signal waveform node */}
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                      <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Querying database...</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FLOATING SHORTCUTS DRAWER */}
            <div className="px-4 py-2 border-t border-white/5 bg-slate-950/90 relative z-10 overflow-hidden">
              <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-none no-scrollbar">
                {shortcuts[language].map((sh, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleShortcutClick(sh.prompt)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold bg-slate-900 hover:bg-cyan-500/15 text-gray-300 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <span>{sh.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CYBERNETIC INPUT PORT */}
            <div className="p-3 border-t border-white/5 bg-slate-900/60 relative z-10 flex items-center gap-2">
              
              {/* Vocal Input Waveform Button */}
              <button
                onClick={toggleVoice}
                className={`p-2.5 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                  isVoiceActive
                    ? "bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400"
                }`}
                title={isVoiceActive ? "Listening active... click to save input" : "Initialize Speech Transceiver"}
              >
                {isVoiceActive ? (
                  <>
                    <MicOff className="h-4.5 w-4.5 animate-pulse" />
                    <span className="absolute inset-[-4px] rounded-full border border-red-500 animate-ping"></span>
                  </>
                ) : (
                  <Mic className="h-4.5 w-4.5" />
                )}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  language === "Tamil"
                    ? "கேள்வி கேட்கவும் (எ.கா. ஐபோன்)..."
                    : language === "Hindi"
                    ? "क्या आप कुछ ढूंढ रहे हैं?..."
                    : "Type quantum shopping search parameters..."
                }
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs outline-none focus:border-cyan-500 text-white placeholder-gray-500 font-mono"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md hover:shadow-cyan-500/20 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer hover:scale-105 active:scale-95 transition-all font-bold"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
