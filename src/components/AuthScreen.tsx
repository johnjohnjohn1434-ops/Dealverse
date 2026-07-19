import React, { useState, useEffect } from "react";
import { 
  Sparkles, Mail, Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight, 
  CheckCircle2, RefreshCw, Key, HelpCircle 
} from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: UserProfile) => void;
  isDarkMode: boolean;
}

export default function AuthScreen({ onAuthSuccess, isDarkMode }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { token, user } = event.data;
        setSuccess("Google Authentication successful! Welcome to DealVerse.");
        if (rememberMe) {
          localStorage.setItem("dealverse_token", token);
        } else {
          sessionStorage.setItem("dealverse_token", token);
        }
        setTimeout(() => {
          onAuthSuccess(token, user);
        }, 1000);
      } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        setError(event.data.error || "Google Sign-In failed.");
        setLoading(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [rememberMe, onAuthSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      setSuccess("Welcome back to DealVerse! Redirecting...");
      if (rememberMe) {
        localStorage.setItem("dealverse_token", data.token);
      } else {
        sessionStorage.setItem("dealverse_token", data.token);
      }
      
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setSuccess("Account created successfully! Syncing preference profiles...");
      if (rememberMe) {
        localStorage.setItem("dealverse_token", data.token);
      } else {
        sessionStorage.setItem("dealverse_token", data.token);
      }

      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1200);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Reset request failed");
      }

      setSuccess(`A security OTP code was generated for verification: ${data.otp}`);
      setTimeout(() => {
        setMode("otp");
        resetStatus();
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      setSuccess("OTP Verified & Password Updated! Logging you in securely...");
      if (rememberMe) {
        localStorage.setItem("dealverse_token", data.token);
      } else {
        sessionStorage.setItem("dealverse_token", data.token);
      }

      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetStatus();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Google Sign-In URL.");
      }
      const { url } = data;

      const authWindow = window.open(
        url,
        "google_oauth_popup",
        "width=500,height=600"
      );

      if (!authWindow) {
        throw new Error("Popup blocked! Please allow popups for this site to sign in with Google.");
      }

      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          setLoading((currLoading) => {
            if (currLoading) {
              setError("Google Sign-In popup closed before completion.");
            }
            return false;
          });
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8 bg-slate-50 dark:bg-slate-950 ${isDarkMode ? "dark" : ""}`}>
      {/* Dynamic Ambient Blur Background elements */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-tr from-blue-600/10 via-orange-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-tr from-transparent via-blue-500/5 to-orange-500/10 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Panel Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-slate-800 shadow-2xl relative z-10 space-y-8"
      >
        {/* DealVerse Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-orange-500 items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Sparkles className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              DealVerse Hub
            </h1>
            <p className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">
              Secure Personalized Access Gateway
            </p>
          </div>
        </div>

        {/* Global Notifications Panel */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4 rounded-2xl text-xs flex items-start gap-2.5 text-red-600 dark:text-red-400 font-semibold"
            >
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 text-red-500 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 p-4 rounded-2xl text-xs flex items-start gap-2.5 text-green-600 dark:text-green-400 font-semibold"
            >
              <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 text-green-500 mt-0.5" />
              <p>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Screens */}
        <AnimatePresence mode="wait">
          
          {/* LOGIN VIEW */}
          {mode === "login" && (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. administrator@dealverse.com"
                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-gray-400" /> Secret Account Password *
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Check options */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
                    />
                    Keep me signed in on this device
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    Authenticate Session <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* SIGN UP VIEW */}
          {mode === "signup" && (
            <motion.form 
              key="signup"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleSignup}
              className="space-y-4"
            >
              <div className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" /> Full Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@domain.com"
                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-gray-400" /> Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters recommended"
                      className="w-full pl-4 pr-10 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
                  />
                  Auto-login and store secure tokens
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Provisioning Account...
                  </>
                ) : (
                  <>
                    Create Secure Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === "forgot" && (
            <motion.form 
              key="forgot"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleForgotPassword}
              className="space-y-4"
            >
              <div className="text-center space-y-2 mb-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <HelpCircle className="h-4.5 w-4.5 text-orange-500" /> Account Recovery
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                  Specify your email address below. We will simulate an automated secure verification OTP handshake.
                </p>
              </div>

              <div className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Account Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@domain.com"
                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode("login"); resetStatus(); }}
                  className="flex-1 py-3.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Request OTP"}
                </button>
              </div>
            </motion.form>
          )}

          {/* OTP VERIFICATION VIEW */}
          {mode === "otp" && (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div className="text-center space-y-2 mb-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Key className="h-4.5 w-4.5 text-orange-500" /> Verify OTP Security Code
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                  For simulated safety, use the OTP code <span className="font-mono text-orange-600 dark:text-orange-400 font-black">123456</span> to reset your credentials.
                </p>
              </div>

              <div className="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-gray-400" /> Enter 6-Digit OTP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full text-center tracking-widest font-mono font-black text-lg px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-gray-400" /> Specify New Secret Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter updated secure password"
                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-600 font-semibold text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode("login"); resetStatus(); }}
                  className="flex-1 py-3.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Verify & Reset"}
                </button>
              </div>
            </motion.form>
          )}

        </AnimatePresence>

        {/* SSO Area divider */}
        {(mode === "login" || mode === "signup") && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-slate-600 font-black justify-center my-2 uppercase tracking-widest">
              <span className="h-px bg-gray-100 dark:bg-slate-800 flex-1"></span>
              <span>Fast Identity Access</span>
              <span className="h-px bg-gray-100 dark:bg-slate-800 flex-1"></span>
            </div>

            {/* Google Single Sign-on Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-100 flex items-center justify-center gap-3 rounded-md transition-all cursor-pointer active:scale-98 shadow-sm"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Footer Navigation Switch links */}
        <div className="text-center pt-2">
          {mode === "login" && (
            <p className="text-xs text-gray-500 font-medium">
              New to DealVerse?{" "}
              <button
                onClick={() => { setMode("signup"); resetStatus(); }}
                className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline cursor-pointer"
              >
                Sign Up & Save Thousands
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-xs text-gray-500 font-medium">
              Already have a member profile?{" "}
              <button
                onClick={() => { setMode("login"); resetStatus(); }}
                className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline cursor-pointer"
              >
                Sign In Securely
              </button>
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}
