"use client";

import Link from "next/link";
import { Mail, Heart, Share } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                InboxReveal
              </span>
            </div>
            <p className="text-sm text-slate-600">
              See what emails really mean — and act on it instantly.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/?login=true" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Get Started
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@inboxreveal.co.uk" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Email Support
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            © 2026 InboxReveal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="text-slate-600 hover:text-blue-600 transition">
              <Heart className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-600 hover:text-blue-600 transition">
              <Share className="w-5 h-5" />
            </a>
            <a href="mailto:hello@inboxreveal.co.uk" className="text-slate-600 hover:text-blue-600 transition">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
