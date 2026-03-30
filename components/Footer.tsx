"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Mail, Heart, Share } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <BrandLogo className="mb-4" textClassName="text-lg font-bold" />
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
                <Link href="/pricing" className="text-sm text-slate-600 hover:text-blue-600 transition">
                  Pricing
                </Link>
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
        <div className="border-t border-slate-200 pt-6 sm:pt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600 text-center md:text-left">
            © 2026 InboxReveal. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 md:justify-end">
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
