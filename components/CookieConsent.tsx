"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("spendwise_cookie_consent");
      if (!consent) {
        // Small delay for smooth entry animation
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  const handleAccept = (type: "all" | "essential") => {
    try {
      localStorage.setItem("spendwise_cookie_consent", JSON.stringify({
        choice: type,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-[#382D25] bg-[#1D1815]/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl ring-1 ring-black/5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E07A28]/15 text-[#E07A28] ring-1 ring-[#E07A28]/30">
            <Cookie size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F6F2EB] flex items-center gap-1.5">
                Privacy & Cookies
              </h3>
              <button
                onClick={() => handleAccept("essential")}
                aria-label="Dismiss cookie notice"
                className="text-[#8C8176] hover:text-[#F6F2EB] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#C6BCB3]">
              We use essential cookies and local storage to secure your session and isolate your personal expense data. We never sell your financial records. Read our{" "}
              <Link href="/privacy" className="text-[#E07A28] underline hover:text-[#F08C3A]">
                Privacy Policy
              </Link>.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAccept("all")}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-[#E07A28]/25 hover:brightness-105 active:scale-95 transition-all"
              >
                Accept All
              </button>
              <button
                onClick={() => handleAccept("essential")}
                className="rounded-xl border border-[#382D25] bg-[#26201B] px-3.5 py-2 text-xs font-medium text-[#C6BCB3] hover:bg-[#28211B] hover:text-[#F6F2EB] transition-all"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
