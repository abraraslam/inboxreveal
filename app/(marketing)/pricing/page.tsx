"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, Crown, Sparkles, Star } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "forever",
    description: "Perfect for getting started with smarter email workflows.",
    icon: Star,
    accent: "from-slate-500 to-slate-700",
    border: "border-slate-200",
    bg: "bg-white",
    cta: "Start Free",
    features: [
      "Connect 1 Gmail account",
      "Email intent classification",
      "Priority tags (low, medium, high)",
      "Basic dashboard view",
      "Up to 100 analyzed emails per month",
    ],
  },
  {
    name: "Premium",
    price: "\u00a33.99",
    period: "per month",
    description: "For professionals who need speed, clarity, and better decisions.",
    icon: Sparkles,
    accent: "from-blue-600 to-indigo-600",
    border: "border-blue-300",
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    cta: "Choose Premium",
    popular: true,
    features: [
      "Everything in Basic",
      "Connect Gmail + Outlook",
      "AI summaries for long threads",
      "Smart alert rules",
      "Suggested replies",
      "Up to 2,000 analyzed emails per month",
    ],
  },
  {
    name: "Gold",
    price: "\u00a38.99",
    period: "per month",
    description: "Full power for advanced users and growing teams.",
    icon: Crown,
    accent: "from-amber-500 to-orange-600",
    border: "border-amber-300",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    cta: "Go Gold",
    features: [
      "Everything in Premium",
      "Unlimited connected inboxes",
      "Advanced priority tuning",
      "Team collaboration-ready insights",
      "Fast-track support",
      "Unlimited analyzed emails",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-5xl md:text-6xl">
              Simple Pricing, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Clear Value</span>
            </h1>
            <p className="mt-5 text-base text-slate-600 sm:text-lg md:text-xl">
              Pick the plan that matches your inbox volume. Upgrade anytime as your workflow grows.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <article
                  key={plan.name}
                  className={`relative rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-8 ${plan.border} ${plan.bg}`}
                >
                  {plan.popular ? (
                    <span className="absolute -top-3 right-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                      Most Popular
                    </span>
                  ) : null}

                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.accent}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900">{plan.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="pb-1 text-sm text-slate-600">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/?login=true"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition shadow-md hover:shadow-lg bg-gradient-to-r ${plan.accent}`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
