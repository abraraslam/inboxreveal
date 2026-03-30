"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_8px_22px_rgba(37,99,235,0.35)]">
              <svg
                viewBox="0 0 48 48"
                className="w-6 h-6"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="7" y="11" width="34" height="26" rx="6" fill="rgba(255,255,255,0.16)" />
                <path
                  d="M10.5 17.5L24 27.5L37.5 17.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="24" r="2.2" fill="white" />
                <circle cx="32" cy="24" r="2.2" fill="white" />
                <path
                  d="M18.2 24H29.8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
              InboxReveal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">
              About Us
            </Link>
            <Link href="/services" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">
              Services
            </Link>
            <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/?login=true"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-700"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-4">
            <Link href="/" className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition py-2">
              Home
            </Link>
            <Link href="/about" className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition py-2">
              About Us
            </Link>
            <Link href="/services" className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition py-2">
              Services
            </Link>
            <Link href="/contact" className="block text-sm font-medium text-slate-700 hover:text-blue-600 transition py-2">
              Contact
            </Link>
            <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/?login=true"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
