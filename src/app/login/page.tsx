"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // Redirect jika sudah login
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.replace(callbackUrl);
    }
  }, [status, router, searchParams]);

  // Tab aktif: 'login' | 'register'
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  // Form State Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Form State Register
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Handler Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Email dan kata sandi wajib diisi");
      return;
    }

    setIsLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
        setIsLoginLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.replace(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk";
      setLoginError(errorMessage);
      setIsLoginLoading(false);
    }
  };

  // Handler Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    if (!registerName.trim()) {
      setRegisterError("Nama lengkap wajib diisi");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerEmail.trim() || !emailRegex.test(registerEmail.trim())) {
      setRegisterError("Format alamat email tidak valid");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("Kata sandi minimal 6 karakter");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsRegisterLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim().toLowerCase(),
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || "Gagal mendaftarkan akun");
        setIsRegisterLoading(false);
        return;
      }

      // Efek selebrasi confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setRegisterSuccess("Akun berhasil dibuat! Mengalihkan ke dashboard...");

      // Otomatis login user setelah register sukses
      const loginResult = await signIn("credentials", {
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        redirect: false,
      });

      if (loginResult?.ok) {
        setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 1000);
      } else {
        setActiveTab("login");
        setLoginEmail(registerEmail);
        setIsRegisterLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mendaftar akun baru";
      setRegisterError(errorMessage);
      setIsRegisterLoading(false);
    }
  };

  // Google OAuth slot handler
  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      alert(
        "Google OAuth belum dikonfigurasi di file environment (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET). Silakan gunakan Email & Password."
      );
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Heading */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 6 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-indigo-500 flex items-center justify-center shadow-glow-emerald mb-4 cursor-pointer"
          >
            <Activity className="w-8 h-8 text-white" />
          </motion.div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              FinPulse
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              PRO
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
            Personal Financial Intelligence & Wealth Tracker
          </p>
        </div>

        {/* Card Box */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-charcoal-900/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl relative">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-charcoal-950/80 rounded-2xl border border-white/[0.06] mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
                setRegisterError("");
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all relative z-10 ${
                activeTab === "login"
                  ? "text-charcoal-950 font-extrabold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {activeTab === "login" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-emerald-400 rounded-xl shadow-glow-emerald -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Masuk
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setLoginError("");
                setRegisterError("");
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all relative z-10 ${
                activeTab === "register"
                  ? "text-charcoal-950 font-extrabold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {activeTab === "register" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-emerald-400 rounded-xl shadow-glow-emerald -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Daftar Akun
            </button>
          </div>

          {/* Form Switcher with Animation */}
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </motion.div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-charcoal-950 font-bold text-xs sm:text-sm shadow-glow-emerald flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke FinPulse</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Google Slot Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-white/[0.08] w-full" />
                  <span className="bg-charcoal-900 px-3 text-[11px] font-medium text-gray-500 uppercase">
                    atau
                  </span>
                </div>

                {/* Google OAuth Button Slot */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 border border-white/[0.08] text-gray-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-3.5"
              >
                {registerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{registerError}</span>
                  </motion.div>
                )}

                {registerSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{registerSuccess}</span>
                  </motion.div>
                )}

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Misal: John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300">
                      Kata Sandi
                    </label>
                    <span className="text-[10px] text-gray-400">Minimal 6 karakter</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-950 border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white text-xs sm:text-sm placeholder-gray-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Register Benefits Notice */}
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400/90 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Otomatis mendapatkan dompet <b>Kas Tunai</b> (Rp 0) & 11 kategori anggaran siap pakai.</span>
                </div>

                {/* Submit Register */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-charcoal-950 font-bold text-xs sm:text-sm shadow-glow-emerald flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Buat Akun & Mulai</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-gray-500 mt-6">
          Dengan masuk atau mendaftar, data finansial Anda terlindungi dengan enkripsi keamanan modern.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
