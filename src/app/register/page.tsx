"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { Lock, Mail, User, Loader2, AlertCircle, ArrowRight, Briefcase, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"recruiter" | "candidate">("recruiter");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProviders().then((providers) => {
      if (active) setGoogleEnabled(Boolean(providers?.google));
    }).catch(() => {
      if (active) setGoogleEnabled(false);
    });
    return () => { active = false; };
  }, []);

  const handleGoogleRegister = async () => {
    setGoogleBusy(true);
    setError(null);
    try {
      const intent = await fetch("/api/auth/google-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await intent.json();
      if (!intent.ok) throw new Error(data.message || "Choose a role before continuing.");
      await signIn("google", { callbackUrl: role === "candidate" ? "/jobs" : "/dashboard" });
    } catch (err) {
      setGoogleBusy(false);
      setError(err instanceof Error ? err.message : "Unable to start Google registration.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all fields.");
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: sanitizedEmail, password, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed.");

      const result = await signIn("credentials", { email: sanitizedEmail, password, redirect: false });
      if (result?.error) {
        router.push("/login?registered=true");
        return;
      }
      router.refresh();
      router.push(role === "candidate" ? "/jobs" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during account creation.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[var(--ink)] py-10 sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute left-[-20%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[var(--coral)]/20 blur-[120px]" />
    <div className="pointer-events-none absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-[var(--sage)]/20 blur-[120px]" />
    <div className="z-10 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="mb-6 flex items-center justify-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--coral)] text-sm font-extrabold tracking-tight text-white shadow-lg shadow-black/25">TL</div><span className="text-2xl font-black tracking-wider text-white">TalentLens <span className="text-[#f1b0a3]">AI</span></span></div>
      <h2 className="text-center text-3xl font-extrabold text-white">Create a new account</h2>
      <p className="mt-2 text-center text-sm text-slate-400">Start immediately with your email and password. No verification code is required.</p>
      <p className="mt-2 text-center text-sm text-slate-400">Already registered? <Link href="/login" className="font-bold text-[#f1b0a3] hover:text-white hover:underline">Sign in here</Link></p>
    </div>
    <div className="z-10 mt-8 px-4 sm:mx-auto sm:w-full sm:max-w-md"><div className="rounded-2xl border border-white/10 bg-[#2d3c33]/70 px-4 py-8 shadow-2xl backdrop-blur-xl sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? <div className="flex items-start gap-3 rounded-xl border border-rose-800/50 bg-rose-950/40 p-4 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" /><span>{error}</span></div> : null}
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">I want to join as a:</label><div className="grid grid-cols-2 gap-3">
          {(["recruiter", "candidate"] as const).map((option) => { const selected = role === option; const Icon = option === "recruiter" ? Briefcase : GraduationCap; return <button key={option} type="button" onClick={() => setRole(option)} className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${selected ? "border-[var(--coral)] bg-[var(--coral)]/12 font-bold text-[#f1b0a3]" : "border-white/10 bg-[var(--ink)] text-slate-400 hover:border-white/20"}`}><Icon size={16} />{option === "recruiter" ? "Recruiter" : "Candidate"}</button>; })}
        </div></div>
        <Field id="name" label="Full name" value={name} onChange={setName} placeholder="John Doe" icon={<User size={16} />} />
        <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="name@company.com" icon={<Mail size={16} />} />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" icon={<Lock size={16} />} />
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--coral)] py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-[var(--coral-deep)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">{loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={16} /></>}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"><span className="h-px flex-1 bg-white/10" /><span>or create with</span><span className="h-px flex-1 bg-white/10" /></div>
      <button type="button" onClick={handleGoogleRegister} disabled={!googleEnabled || googleBusy} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-[#4285f4]">G</span>{googleBusy ? "Connecting..." : googleEnabled ? `Continue with Google as ${role === "candidate" ? "Candidate" : "Recruiter"}` : "Google sign-up · setup required"}</button>
      <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">Choose Recruiter or Candidate above before using Google.</p>
    </div></div>
  </div>;
}

function Field({ id, label, type = "text", value, onChange, placeholder, icon }: { id: string; label: string; type?: string; value: string; onChange: (value: string) => void; placeholder: string; icon: React.ReactNode }) {
  return <div><label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label><div className="relative mt-2 rounded-xl shadow-sm"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">{icon}</div><input id={id} type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="block w-full rounded-xl border border-white/10 bg-[var(--ink)] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition duration-150 focus:border-[var(--coral)] focus:outline-none focus:ring-4 focus:ring-[var(--coral)]/10" placeholder={placeholder} /></div></div>;
}
