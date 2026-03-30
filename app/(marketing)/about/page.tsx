"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Lightbulb, Target, Eye, Award } from "lucide-react";

export default function About() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* Hero Section */}
        <section className="px-4 py-14 max-w-7xl mx-auto sm:px-6 sm:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">InboxReveal</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              We're building the intelligence layer for email — helping professionals and businesses understand what truly matters inside their inbox.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8">Our Story</h2>

            <div className="prose text-slate-600 space-y-6 sm:prose-lg">
              <p>
                InboxReveal was born from a simple observation: <strong>the most critical message is often buried inside the email body, not highlighted in the subject line.</strong>
              </p>

              <p>
                Every day, professionals receive hundreds of emails. But traditional email platforms focus on managing emails, not understanding them. They let you search by sender or subject, but they can't tell you what an email truly means.
              </p>

              <p>
                This creates real problems:
              </p>

              <ul className="space-y-3 my-6">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Missed opportunities:</strong> Sales leads get missed because buying intent is hidden in the email body</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Delayed responses:</strong> Critical customer complaints go unnoticed, damaging relationships</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Wasted time:</strong> Professionals spend hours reading emails instead of acting on them</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Poor decisions:</strong> Without context, responses are reactive instead of strategic</span>
                </li>
              </ul>

              <p>
                Existing solutions like Gmail and Microsoft Outlook are excellent at managing volume, but they're not designed to understand email content. They show messages — but they don't understand them.
              </p>

              <p>
                That's where InboxReveal comes in. We built InboxReveal as a new layer on top of email: <strong>an AI-powered intelligence system that reads, understands, and acts on what's really inside your emails.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Founder Insight */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-12">
            <Lightbulb className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">The Core Insight</h3>
            <p className="text-base sm:text-lg text-slate-700">
              "Email tools show messages — but they don't understand them. InboxReveal bridges that gap by detecting intent, highlighting urgency, and recommending actions. We transform email from a passive communication tool into an active decision-support system."
            </p>
          </div>
        </section>

        {/* Vision & Values */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Our Vision</h3>
                <p className="text-slate-600 text-sm">
                  To become the intelligence layer for email communication, enabling users to understand not just what emails say, but what they mean and what action they require.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Our Mission</h3>
                <p className="text-slate-600 text-sm">
                  Help professionals and businesses take control of their inbox by understanding what truly matters and acting on it instantly.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Our Values</h3>
                <p className="text-slate-600 text-sm">
                  Clarity, efficiency, reliability, and user-centricity. We build for people, not systems.
                </p>
              </div>

              <div className="p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Our Promise</h3>
                <p className="text-slate-600 text-sm">
                  Intelligent, accurate, and actionable insights that save you time and help you make better decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8">Why Choose InboxReveal?</h2>

          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-slate-200 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Built for Real Problems</h3>
              <p className="text-slate-600">
                InboxReveal isn't theoretical. It's built to solve the specific challenges professionals face with high-volume, complex email communication.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Understanding</h3>
              <p className="text-slate-600">
                Our AI doesn't just search for keywords — it understands intent, urgency, and context to deliver truly actionable insights.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Privacy & Security First</h3>
              <p className="text-slate-600">
                Your email data is your data. We use secure, encrypted connections and never store your full email content on our servers.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Integration</h3>
              <p className="text-slate-600">
                Connect Gmail or Outlook with one click. No complex setup. No technical knowledge required. Start analyzing emails in seconds.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Continuously Improving</h3>
              <p className="text-slate-600">
                Our AI learns and improves over time. The more you use InboxReveal, the better it understands your priorities and context.
              </p>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">Who Uses InboxReveal?</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Small Business Owners</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Manage customer communications more effectively and never miss growth opportunities hidden in emails.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Customer Support Teams</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Identify urgent issues and customer sentiment instantly, allowing faster and more accurate responses.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sales Professionals</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Detect buying intent and sales opportunities hidden in email conversations and respond faster.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Freelancers & Consultants</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Manage multiple client communications efficiently and prioritize time-sensitive requests.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Agency Teams</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Handle multiple client mailboxes with clarity, ensuring nothing important falls through the cracks.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                <h3 className="text-lg font-bold text-slate-900 mb-2">High-Volume Email Users</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Anyone dealing with hundreds of emails daily who needs better prioritization and understanding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24 max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
            <div className="relative p-6 text-center text-white sm:p-10 md:p-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Join the InboxReveal Community</h2>
              <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6">
                Experience the future of email intelligence today
              </p>
              <button className="px-8 py-3 rounded-lg bg-white text-blue-600 font-semibold hover:shadow-lg transition">
                Get Started Free
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
