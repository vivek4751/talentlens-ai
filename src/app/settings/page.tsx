"use client";

import { FormEvent, useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTheme } from "@/components/ThemeProvider";
import { KeyRound, Moon, Save, ShieldCheck, Sun, UserRound } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  hasPassword: boolean;
};

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load profile");
        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch(() => setProfileMessage({ type: "error", text: "We could not load your profile." }));
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update profile");
      setProfile(data);
      setProfileMessage({ type: "success", text: "Profile details saved." });
    } catch (error) {
      setProfileMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update profile." });
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "The new passwords do not match." });
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to change password");
      setPasswordMessage({ type: "success", text: data.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfile((value) => (value ? { ...value, hasPassword: true } : value));
    } catch (error) {
      setPasswordMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to change password." });
    } finally {
      setPasswordBusy(false);
    }
  };

  const messageClass = (type: "success" | "error") => type === "success"
    ? "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]"
    : "border-[var(--coral)]/40 bg-[var(--surface-soft)] text-[var(--ink)]";

  return (
    <DashboardLayout>
      <div className="animate-rise-in mb-7 sm:mb-9">
        <p className="eyebrow">Account centre</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">Profile & settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Keep your account details current and control how TalentLens feels to use.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <section className="panel p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-[var(--line)] pb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--ink)]"><UserRound size={19} /></div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)]">Personal details</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">This is the profile information shown across your workspace.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Full name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10" placeholder="Your name" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Email address</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10" placeholder="you@company.com" />
              </label>
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--muted)]">Role: <strong className="capitalize text-[var(--ink)]">{profile?.role || "—"}</strong></span>
              <button disabled={profileBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--coral)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--coral-deep)] disabled:opacity-60"><Save size={16} />{profileBusy ? "Saving..." : "Save details"}</button>
            </div>
            {profileMessage && <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${messageClass(profileMessage.type)}`}>{profileMessage.text}</p>}
          </form>
        </section>

        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--ink)]"><KeyRound size={19} /></div>
              <div>
                <h2 className="text-lg font-bold text-[var(--ink)]">Security</h2>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{profile?.hasPassword ? "Change your local account password." : "Set a password so you can also sign in with email."}</p>
              </div>
            </div>
            <form onSubmit={changePassword} className="mt-5 space-y-3.5">
              {profile?.hasPassword && <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10" />}
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (8+ characters)" minLength={8} required autoComplete="new-password" className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10" />
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" minLength={8} required autoComplete="new-password" className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10" />
              <button disabled={passwordBusy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--coral)] hover:text-[var(--coral-deep)] disabled:opacity-60">{passwordBusy ? "Updating..." : "Update password"}</button>
              {passwordMessage && <p className={`rounded-xl border px-3.5 py-3 text-sm font-medium ${messageClass(passwordMessage.type)}`}>{passwordMessage.text}</p>}
            </form>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--ink)]">{theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}</div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--ink)]">Appearance</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Use the theme that fits your workday.</p>
                </div>
              </div>
              <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" className={`relative h-7 w-12 rounded-full transition ${theme === "dark" ? "bg-[var(--coral)]" : "bg-[#b8c6b6]"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${theme === "dark" ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-[var(--ink)]">
            <div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p className="text-sm leading-6"><strong>Account safety.</strong> Passwords are encrypted before storage. Google-only accounts can create a local password from this page.</p></div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
