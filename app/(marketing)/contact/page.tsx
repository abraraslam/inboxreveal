"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send, Share, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to a backend API
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* Hero Section */}
        <section className="px-6 py-20 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Get in <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Left Column - Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Information</h2>

              <div className="space-y-6 mb-12">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Email</h3>
                    <p className="text-slate-600">support@inboxreveal.com</p>
                    <p className="text-slate-500 text-sm mt-1">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Chat Support</h3>
                    <p className="text-slate-600">Available in the app dashboard</p>
                    <p className="text-slate-500 text-sm mt-1">Monday - Friday, 9 AM - 5 PM GMT</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Location</h3>
                    <p className="text-slate-600">United Kingdom</p>
                    <p className="text-slate-500 text-sm mt-1">Serving customers worldwide</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <Share className="w-5 h-5" />
                  </a>
                  <a
                    href="mailto:support@inboxreveal.com"
                    className="flex items-center justify-center w-12 h-12 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Send us a message</h2>

                {submitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">Message Sent!</h3>
                    <p className="text-emerald-700">
                      Thank you for reaching out. We'll get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us what this is about"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Your message here..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:from-blue-700 hover:to-indigo-700 transition inline-flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-slate-600">
                Find answers to common questions about InboxReveal
              </p>
            </div>

            <div className="space-y-4">
              <details className="group border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  Is InboxReveal free?
                  <span className="ml-4 text-slate-600 group-open:rotate-180 transition">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">
                  Yes! InboxReveal offers a free plan with basic keyword detection. Paid plans unlock advanced AI features, alerts, and analytics.
                </p>
              </details>

              <details className="group border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  What email providers do you support?
                  <span className="ml-4 text-slate-600 group-open:rotate-180 transition">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">
                  We support Gmail and Microsoft Outlook. More providers coming soon.
                </p>
              </details>

              <details className="group border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  Is my data secure?
                  <span className="ml-4 text-slate-600 group-open:rotate-180 transition">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">
                  Absolutely. We use end-to-end encryption, secure OAuth connections, and never store your email passwords. Your privacy is our priority.
                </p>
              </details>

              <details className="group border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  Can I use InboxReveal on mobile?
                  <span className="ml-4 text-slate-600 group-open:rotate-180 transition">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">
                  Our web app is fully responsive and works on mobile browsers. Native iOS and Android apps are on our roadmap.
                </p>
              </details>

              <details className="group border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  How do I cancel my subscription?
                  <span className="ml-4 text-slate-600 group-open:rotate-180 transition">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600">
                  You can cancel anytime from your account settings. No questions asked. No cancellation fees.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
