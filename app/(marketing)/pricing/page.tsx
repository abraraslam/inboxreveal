import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, Crown, Sparkles, Star } from "lucide-react";

type PricingPlan = {
  name: "Basic" | "Premium" | "Gold";
  price: string;
  period: string;
  description: string;
  icon: typeof Star;
  accent: string;
  border: string;
  bg: string;
  cta: string;
  checkoutPlan?: "premium" | "gold";
  features: string[];
  popular?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Basic",
    price: "Free",
    period: "forever",
    description: "Perfect for individuals who want clear inbox priorities without extra complexity.",
    icon: Star,
    accent: "from-slate-500 to-slate-700",
    border: "border-slate-200",
    bg: "bg-white",
    cta: "Start Free",
    features: [
      "Connect 1 Google account (Gmail or Workspace)",
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
    description: "For professionals who want AI summaries, smarter reply drafting, and more control over busy inboxes.",
    icon: Sparkles,
    accent: "from-blue-600 to-indigo-600",
    border: "border-blue-300",
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    cta: "Choose Premium",
    checkoutPlan: "premium",
    popular: true,
    features: [
      "Everything in Basic",
      "Connect Google Workspace + Microsoft 365",
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
    description: "For advanced users who want the full AI workflow, including Gold-only draft review tools.",
    icon: Crown,
    accent: "from-amber-500 to-orange-600",
    border: "border-amber-300",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    cta: "Go Gold",
    checkoutPlan: "gold",
    features: [
      "Everything in Premium",
      "Gold-only AI draft review",
      "Professional, shorter, polite, and persuasive rewrite actions",
      "Compose draft AI review tools",
      "Unlimited analyzed emails",
    ],
  },
];

const upgradeReasons = [
  {
    title: "Planned for Premium",
    description:
      "These are the next workflow upgrades that fit the Premium tier and are planned as future additions.",
    items: [
      "Smart follow-up reminders for unanswered threads",
      "Weekly AI insight digest with top risks and opportunities",
      "Multi-inbox unified view for freelancers and agencies",
      "SLA risk alerts for time-sensitive emails",
    ],
  },
  {
    title: "Planned for Gold",
    description:
      "These are larger team and analytics features we would place in Gold as future additions.",
    items: [
      "Shared workspace with assignments and internal notes",
      "Approval workflow for AI-generated replies",
      "Custom AI playbooks for tone and escalation rules",
      "Advanced analytics across intent, response speed, and outcomes",
    ],
  },
];

const comparisonRows = [
  {
    feature: "Connected inboxes",
    basic: "1 Google inbox",
    premium: "Google Workspace or Microsoft 365",
    gold: "Google Workspace or Microsoft 365",
  },
  {
    feature: "Monthly analysis volume",
    basic: "100 emails",
    premium: "2,000 emails",
    gold: "Unlimited",
  },
  {
    feature: "AI summaries",
    basic: "-",
    premium: "Included",
    gold: "Included",
  },
  {
    feature: "Suggested replies",
    basic: "-",
    premium: "Included",
    gold: "Included",
  },
  {
    feature: "Smart alert rules",
    basic: "-",
    premium: "Included",
    gold: "Included",
  },
  {
    feature: "AI review workflows",
    basic: "-",
    premium: "-",
    gold: "Included",
  },
  {
    feature: "Team collaboration",
    basic: "-",
    premium: "Planned",
    gold: "Planned",
  },
  {
    feature: "Advanced analytics",
    basic: "Dashboard counts",
    premium: "Dashboard counts",
    gold: "Dashboard counts",
  },
  {
    feature: "Support level",
    basic: "Email support",
    premium: "Email support",
    gold: "Email support",
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
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
              <span className="text-base">🎁</span>
              <span className="text-sm font-semibold text-amber-800">All plans include a 14-day free trial — full Gold access from day one.</span>
            </div>
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
                  <span className="absolute -top-3 left-5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                    14-day free trial
                  </span>

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
                    href={
                      plan.checkoutPlan
                        ? `/api/stripe/checkout?plan=${plan.checkoutPlan}`
                        : "/dashboard"
                    }
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition shadow-md hover:shadow-lg bg-gradient-to-r ${plan.accent}`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
              Planned Paid Features
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              These ideas are intentionally shown as roadmap items, not features that are already live in the dashboard today.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {upgradeReasons.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <h3 className="text-xl font-bold text-slate-900">{group.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  {group.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
              Compare Plans At A Glance
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              A quick side-by-side breakdown of what each plan unlocks.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-900 sm:px-6">
                      Feature
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-900 sm:px-6">
                      Basic
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-blue-700 sm:px-6">
                      Premium
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-amber-700 sm:px-6">
                      Gold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-slate-900 sm:px-6">
                        {row.feature}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                        {row.basic}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {row.premium}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {row.gold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
