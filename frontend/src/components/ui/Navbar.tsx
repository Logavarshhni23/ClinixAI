"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Stethoscope,
  Sparkles,
  FileText,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Overview", icon: Sparkles },
  { href: "/assess", label: "Health Assessment", icon: Stethoscope },
  { href: "/results", label: "Results", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <nav className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:bg-teal-500 transition-colors">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              Clinix<span className="text-teal-600">AI</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-teal-600" : "text-slate-400"} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>41 Diseases Live</span>
          </div>

          <Link
            href="/assess"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <span>Start Assessment</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                pathname === href
                  ? "bg-slate-100 dark:bg-slate-800 text-teal-600"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/assess"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md"
            >
              Start Assessment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
