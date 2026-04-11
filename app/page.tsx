"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Mail,
  Zap,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Settings2,
  PlayCircle,
} from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [signingProvider, setSigningProvider] = useState<"google" | "azure-ad" | null>(null);

  const handleProviderSignIn = async (provider: "google" | "azure-ad") => {
    setSigningProvider(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
    setSigningProvider(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncLoginModalFromUrl = () => {
      const query = new URLSearchParams(window.location.search);
      setShowLoginModal(query.get("login") === "true");
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const dispatchLocationChange = () => {
      window.dispatchEvent(new Event("locationchange"));
    };

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      dispatchLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      dispatchLocationChange();
    };

    syncLoginModalFromUrl();

    window.addEventListener("popstate", syncLoginModalFromUrl);
    window.addEventListener("hashchange", syncLoginModalFromUrl);
    window.addEventListener("locationchange", syncLoginModalFromUrl);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", syncLoginModalFromUrl);
      window.removeEventListener("hashchange", syncLoginModalFromUrl);
      window.removeEventListener("locationchange", syncLoginModalFromUrl);
    };
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <section className="relative mx-auto max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 md:py-32">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-blue-100/40 via-transparent to-indigo-100/40 blur-3xl" />

          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  AI-Powered Email Intelligence
                </span>
              </div>

              <h1 className="mb-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-6xl">
                See what emails really <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">mean</span>
              </h1>

              <p className="mb-8 text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
                InboxReveal detects hidden intent inside email bodies and helps you act faster. Spot risk, uncover opportunity, and respond with confidence before important emails slip past you.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl sm:px-8"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-8"
                >
                  Explore Features
                </a>
              </div>
              

              <p className="mt-6 text-sm text-slate-500">
                Google Workspace and Microsoft 365 support • Dashboard alerts • AI summaries • No credit card required
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur-2xl" />
              <div className="relative rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">High Priority</p>
                      <p className="mt-1 text-xs text-slate-400">Refund request detected in the message body</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">Sales Opportunity</p>
                      <p className="mt-1 text-xs text-slate-400">Strong buying intent found in a buried conversation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">Recommended Action</p>
                      <p className="mt-1 text-xs text-slate-400">Suggested next step: respond soon to address churn risk</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">How It Works</h2>
              <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg">
                InboxReveal is designed to be fully useful in minutes. Connect your mailbox,
                set your preferences once, and the app applies your choices to every summary,
                analysis, and draft.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                  <PlayCircle className="h-6 w-6 text-blue-700" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Step 1</p>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Connect your account</h3>
                <p className="text-sm text-slate-600">
                  Sign in with Google Workspace or Microsoft 365, then allow access so InboxReveal can read and process
                  your inbox securely.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100">
                  <Settings2 className="h-6 w-6 text-emerald-700" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Step 2</p>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Set up Preferences</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Open Dashboard and click Preferences.</li>
                  <li>Choose default reply tone: Professional, Friendly, or Direct.</li>
                  <li>Select summary depth and preferred draft length.</li>
                  <li>Turn auto-analyze on if you want instant intent detection.</li>
                  <li>Save once to apply across summaries and drafts.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100">
                  <CheckCircle2 className="h-6 w-6 text-violet-700" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">Step 3</p>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Review and respond faster</h3>
                <p className="text-sm text-slate-600">
                  InboxReveal now uses your saved preferences to rank priorities, generate clearer summaries,
                  and suggest replies in your chosen style.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/50 px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">Why Traditional Email Falls Short</h2>
              <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg md:text-xl">
                Important intent is usually hidden in the message body, not the subject line.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Subject: "Thanks"</h3>
                <p className="text-sm text-slate-600">Body: "I would like a refund."</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Subject: "Update"</h3>
                <p className="text-sm text-slate-600">Body: "We are not satisfied with the service."</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Subject: "Quick question"</h3>
                <p className="text-sm text-slate-600">Body: "Can you send pricing details for the team plan?"</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">How InboxReveal Helps</h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg md:text-xl">
              Understand every email faster by answering three questions clearly.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 blur" />
              <div className="rounded-xl border border-slate-200 bg-white/80 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">What is hidden?</h3>
                <p className="mb-4 text-slate-600">Scan full email bodies for phrases, patterns, and meaning that ordinary inbox tools miss.</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>Keyword detection</li>
                  <li>Phrase matching</li>
                  <li>Semantic understanding</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 opacity-10 blur" />
              <div className="rounded-xl border border-slate-200 bg-white/80 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100">
                  <Zap className="h-6 w-6 text-sky-600" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">How important is it?</h3>
                <p className="mb-4 text-slate-600">Detect urgency, complaints, refund requests, and sales signals so you know what needs attention first.</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>Intent classification</li>
                  <li>Priority tagging</li>
                  <li>Risk assessment</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 opacity-10 blur" />
              <div className="rounded-xl border border-slate-200 bg-white/80 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">What should I do next?</h3>
                <p className="mb-4 text-slate-600">Get summaries, recommended actions, and faster response paths for the messages that matter most.</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>Action recommendations</li>
                  <li>AI summaries</li>
                  <li>Faster replies</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl">Built for Professionals Who Live in Email</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Reduce missed opportunities</h3>
                  <p className="text-slate-300">Surface buying intent and urgent requests before they get lost in long threads.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Improve response time</h3>
                  <p className="text-slate-300">Dashboard alerts and priority tags help you see what needs attention first.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Spend less time triaging</h3>
                  <p className="text-slate-300">Spend less time sorting messages and more time acting on what matters.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Work with clarity</h3>
                  <p className="text-slate-300">Get simple explanations of intent, risk, and the next best step.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-95" />
            <div className="relative px-5 py-12 text-center sm:px-8 sm:py-16 md:py-20">
              <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl md:text-5xl">Turn your inbox into a decision engine</h2>
              <p className="mx-auto mb-8 max-w-2xl text-base text-blue-100 sm:text-lg md:text-xl">Connect Google Workspace or Microsoft 365 in minutes and start seeing what your emails are really telling you.</p>

              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg transition hover:scale-105 hover:shadow-xl sm:px-8 sm:py-4"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700"
              aria-label="Close sign-in modal"
            >
              x
            </button>

            <div className="mb-6 text-center">
              <BrandLogo size="lg" showText={false} className="mb-4 justify-center" />
              <h2 className="text-2xl font-bold text-slate-900">Sign in to InboxReveal</h2>
              <p className="mt-2 text-sm text-slate-600">Connect your email account to start using AI-powered inbox intelligence.</p>
              <p className="mt-1 text-xs text-slate-500">Supports both consumer and business accounts.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleProviderSignIn("google")}
                disabled={signingProvider !== null}
                className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {signingProvider === "google" ? "Redirecting..." : "Sign in with Gmail or Google Workspace"}
              </button>

              <button
                onClick={() => handleProviderSignIn("azure-ad")}
                disabled={signingProvider !== null}
                className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z" />
                  <path fill="#7FBA00" d="M11.4 11.4H0V0h11.4v11.4z" />
                  <path fill="#FFB900" d="M24 11.4H12.6V0H24v11.4z" />
                </svg>
                {signingProvider === "azure-ad" ? "Redirecting..." : "Sign in with Outlook or Microsoft 365"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
