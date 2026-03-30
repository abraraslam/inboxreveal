"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Mail,
  Zap,
  Bell,
  Search,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Services() {
  const features = [
    {
      icon: Mail,
      title: "Email Integration",
      description:
        "Seamlessly connect Gmail and Outlook accounts with secure API-based integration.",
      details: ["One-click authentication", "Secure OAuth connection", "Gmail and Outlook support"],
    },
    {
      icon: Search,
      title: "Body-Only Keyword Detection",
      description:
        "Detect keywords and phrases specifically within email body content, not just subject lines.",
      details: ["Custom keyword setup", "Phrase matching", "Pattern recognition"],
    },
    {
      icon: Zap,
      title: "Intent Classification",
      description:
        "Automatically categorize emails by their true intent and urgency level.",
      details: [
        "Complaint detection",
        "Refund request identification",
        "Sales opportunity flagging",
        "Urgency assessment",
      ],
    },
    {
      icon: Bell,
      title: "Dashboard Alerts",
      description:
        "See important signals surfaced inside your dashboard while you review your inbox.",
      details: ["Priority tagging", "Alerted email filter", "Customizable alert categories"],
    },
    {
      icon: MessageSquare,
      title: "AI Email Summary",
      description:
        "Generate intelligent summaries of long or complex email conversations.",
      details: ["Key insights extraction", "Content condensing", "Action items highlighting"],
    },
    {
      icon: TrendingUp,
      title: "Smart Dashboard",
      description:
        "View all your emails in a prioritized, intelligent dashboard with actionable insights.",
      details: [
        "Dashboard filtering",
        "Email prioritization",
        "Activity overview",
        "Saved analysis history",
      ],
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* Hero Section */}
        <section className="px-4 py-14 max-w-7xl mx-auto sm:px-6 sm:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Features That Make a <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Difference</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Discover the powerful tools that transform your email communication into action-driven intelligence.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-6 sm:p-8 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 rounded-xl transition -z-10 duration-300" />

                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 text-sm mb-4">
                      {feature.description}
                    </p>

                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Built on Four Core Pillars
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600">
                Each pillar works together to deliver complete email intelligence
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              <div className="relative p-6 sm:p-8 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Body Intelligence</h3>
                <p className="text-slate-700 mb-4">
                  We focus on analyzing the full email content rather than relying on subject lines alone.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Keyword detection
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Phrase matching
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Semantic understanding
                  </li>
                </ul>
              </div>

              <div className="relative p-6 sm:p-8 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Hidden Intent Detection</h3>
                <p className="text-slate-700 mb-4">
                  Our AI identifies intent categories to classify what each email truly means.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    Complaint detection
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    Refund identification
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    Sales opportunity flagging
                  </li>
                </ul>
              </div>

              <div className="relative p-6 sm:p-8 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Smart Alerts</h3>
                <p className="text-slate-700 mb-4">
                  Important signals are surfaced directly in the dashboard so you can review them faster.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Dashboard alerts
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Priority tagging
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Customizable triggers
                  </li>
                </ul>
              </div>

              <div className="relative p-6 sm:p-8 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Decision Support</h3>
                <p className="text-slate-700 mb-4">
                  InboxReveal provides guidance, not just data, to help you act with confidence.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Actionable recommendations
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Response templates
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Next step guidance
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Real-World Use Cases
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">
              See how different professionals benefit from InboxReveal
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Customer Support Manager</h3>
              <p className="text-slate-600 mb-4">
                "InboxReveal helps support teams surface urgent complaints and refund requests faster, so important issues are easier to prioritize."
              </p>
              <p className="text-sm text-slate-500 font-medium">Example use case: faster complaint triage</p>
            </div>

            <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Sales Professional</h3>
              <p className="text-slate-600 mb-4">
                "InboxReveal helps sales teams spot buying intent and sales opportunities that might otherwise stay buried in long threads."
              </p>
              <p className="text-sm text-slate-500 font-medium">Example use case: clearer lead prioritization</p>
            </div>

            <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Small Business Owner</h3>
              <p className="text-slate-600 mb-4">
                "InboxReveal helps busy owners prioritize what feels most urgent so they can spend less energy manually sorting the inbox."
              </p>
              <p className="text-sm text-slate-500 font-medium">Example use case: less inbox triage overhead</p>
            </div>

            <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Freelance Consultant</h3>
              <p className="text-slate-600 mb-4">
                "InboxReveal helps consultants keep client conversations more organized by surfacing priority and intent in one dashboard."
              </p>
              <p className="text-sm text-slate-500 font-medium">Example use case: more consistent client follow-through</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-10 sm:mb-12 text-center">
              How InboxReveal Works
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Your Email</h3>
                  <p className="text-slate-600">
                    Sign in with your Gmail or Outlook account. The connection is secure and encrypted. InboxReveal never stores your passwords.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Define Your Preferences</h3>
                  <p className="text-slate-600">
                    Tell us what terms and phrases matter to you. Set alert preferences. Choose what notifications you want.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">AI Analysis Begins</h3>
                  <p className="text-slate-600">
                    InboxReveal scans your inbox and analyzes email bodies for intent, keywords, and urgency. This happens continuously and intelligently.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Receive Intelligent Alerts</h3>
                  <p className="text-slate-600">
                    Review important emails through dashboard alerts, prioritized views, AI-generated summaries, and actionable recommendations.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 md:gap-8">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold">
                    5
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Act Immediately</h3>
                  <p className="text-slate-600">
                    Respond to emails faster and more strategically. With InboxReveal, you know what matters and why. You can act with clarity and confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
            <div className="relative p-12 text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Experience Email Intelligence Today</h2>
              <p className="text-xl text-blue-100 mb-6">
                Sign up for free and see how InboxReveal transforms your inbox
              </p>
              <button className="px-8 py-3 rounded-lg bg-white text-blue-600 font-semibold hover:shadow-lg hover:scale-105 transition inline-flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
