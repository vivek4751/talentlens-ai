"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-blue-500 h-10 w-10" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");
  const registeredParam = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "CredentialsSignin"
      ? "Invalid email or password"
      : errorParam === "GoogleAccountNotRegistered"
        ? "This Google account is not registered yet. Open Create a new profile and choose Recruiter or Candidate first."
        : errorParam === "GoogleAccountExists"
          ? "This Google account is already registered. Continue from the login page instead."
          : null
  );

  useEffect(() => {
    let active = true;
    getProviders()
      .then((providers) => {
        if (active) setGoogleEnabled(Boolean(providers?.google));
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    await signIn("google", { callbackUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);
      setError(null);

      const result = await signIn("credentials", {
        email: sanitizedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      setError("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--ink)] px-4 py-10 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[var(--coral)]/20 blur-[120px]"></div>
      <div className="pointer-events-none absolute -bottom-56 -right-40 h-[34rem] w-[34rem] rounded-full bg-[var(--sage)]/20 blur-[140px]"></div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "42px 42px" }}></div>

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#2d3c33]/70 shadow-2xl shadow-black/20 backdrop-blur-sm lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--coral)] text-white shadow-lg shadow-black/30">
                <Sparkles size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-white">TalentLens <span className="text-[#f1b0a3]">AI</span></p>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Hiring intelligence</p>
              </div>
            </div>
            <p className="mt-16 max-w-sm text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Turn better signals into better hires.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              A calm, explainable workspace for screening candidates, comparing fit, and moving great people forward.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck size={16} className="text-emerald-400" />
            Your recruiting workspace is protected
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10 xl:p-14">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--coral)] text-white"><Sparkles size={18} fill="currentColor" /></div>
            <span className="text-xl font-bold tracking-tight text-white">TalentLens <span className="text-[#f1b0a3]">AI</span></span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Sign in to continue</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Access your workspace or <Link href="/register" className="font-semibold text-[#f1b0a3] transition hover:bg-[var(--coral-deep)]">create a new profile</Link>.
          </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#18231e]/55 p-5 shadow-xl sm:p-7">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {registeredParam === "true" && !error && (
              <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <span>Registration successful! Please sign in with your credentials.</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white placeholder-slate-500 transition duration-150 focus:border-[var(--coral)] focus:bg-white/[0.09] focus:outline-none focus:ring-4 focus:ring-[var(--coral)]/10"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white placeholder-slate-500 transition duration-150 focus:border-[var(--coral)] focus:bg-white/[0.09] focus:outline-none focus:ring-4 focus:ring-[var(--coral)]/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--coral)] py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-[var(--coral-deep)] disabled:bg-slate-700 disabled:text-slate-400 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!googleEnabled || googleBusy}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-[#4285f4]">G</span>
            {googleBusy ? "Connecting..." : googleEnabled ? "Continue with Google" : "Google sign-in · setup required"}
          </button>
          {!googleEnabled && <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">Add Google OAuth keys to your environment to enable this option.</p>}

          {/* Quick login helper block */}
          <div className="mt-6 border-t border-slate-700/60 pt-6">
            <div className="text-center text-xs text-slate-500 font-medium">
              New here? Create a profile first and choose your account role. Google sign-in is for existing accounts.
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
