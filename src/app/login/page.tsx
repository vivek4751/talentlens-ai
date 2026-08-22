"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Globe2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() { return <Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[var(--coral)]" /></div>}><LoginForm /></Suspense>; }

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const initialError = searchParams.get("error") === "CredentialsSignin" ? "Invalid email or password." : searchParams.get("error") === "GoogleAccountNotRegistered" ? "This Google account is not registered yet." : null;
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => { let active = true; getProviders().then((providers) => { if (active) setGoogleEnabled(Boolean(providers?.google)); }).catch(() => { if (active) setGoogleEnabled(false); }); return () => { active = false; }; }, []);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!email || !password) { setError("Please enter both email and password."); return; } setLoading(true); setError(null); try { const result = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false }); if (result?.error) { setError("Invalid email or password."); } else { router.refresh(); router.push(callbackUrl); } } catch { setError("An unexpected authentication error occurred."); } finally { setLoading(false); } };
  const loginGoogle = async () => { setGoogleBusy(true); await signIn("google", { callbackUrl }); };

  return <div className="tl-auth"><aside className="tl-auth-editorial"><p className="tl-eyebrow text-[var(--coral)]">TALENTLENS / ACCESS</p><h1>Recruitment has more signal than noise.</h1><p>Use structured evidence to move from a pile of resumes to a clearer, faster decision.</p><div className="tl-auth-square" /><div className="tl-auth-foot"><span>01</span><p>Make every candidate conversation more informed.</p></div></aside><main className="tl-auth-form-wrap"><section className="tl-auth-form"><p className="tl-micro">WELCOME BACK</p><h2>Sign in to TalentLens.</h2><p>Use your credentials or continue with your Google account.</p><form onSubmit={submit}>{error && <div className="tl-auth-alert"><AlertCircle size={16} />{error}</div>}{searchParams.get("registered") === "true" && !error && <div className="tl-auth-success"><ShieldCheck size={16} />Registration successful. Please sign in.</div>}<label>Email address<span><Mail size={15} /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></span></label><label>Password<span><Lock size={15} /><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></span></label><button type="submit" className="tl-red-button w-full">{loading ? <><Loader2 className="animate-spin" size={16} />Signing in…</> : <>Sign in <ArrowRight size={16} /></>}</button></form><div className="tl-auth-divider"><span>or</span></div><button type="button" onClick={loginGoogle} disabled={!googleEnabled || googleBusy} className="tl-auth-google"><Globe2 size={17} />{googleBusy ? "Connecting…" : googleEnabled ? "Continue with Google" : "Google sign-in · setup required"}</button><p className="tl-auth-switch">New to TalentLens? <Link href="/register">Create a profile</Link></p></section></main></div>;
}
