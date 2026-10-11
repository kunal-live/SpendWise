import Link from "next/link";
import { ArrowLeft, Home, LayoutDashboard, Search, HelpCircle } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | SpendWise",
  description: "The page you are looking for does not exist on SpendWise."
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121316] px-6 text-center text-[#C6BCB3]">
      {/* Subtle Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[#E07A28]/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg rounded-3xl border border-[#382D25] bg-[#1D1815] p-8 md:p-12 shadow-xl">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#E07A28]/10 text-[#E07A28] ring-1 ring-[#E07A28]/25">
          <HelpCircle size={32} />
        </div>

        <span className="rounded-full border border-[#E07A28]/25 bg-[#E07A28]/10 px-3.5 py-1 text-xs font-semibold text-[#E07A28]">
          Error 404
        </span>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#F6F2EB] md:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-[#8C8176] leading-relaxed">
          The requested page might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#E07A28]/25 hover:brightness-105 active:scale-95 transition-all"
          >
            <LayoutDashboard size={16} /> Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#382D25] bg-[#26201B] px-5 py-2.5 text-sm font-semibold text-[#F6F2EB] hover:bg-[#28211B] transition-all"
          >
            <Home size={16} /> Home / Sign In
          </Link>
        </div>

        <div className="mt-8 border-t border-[#382D25] pt-6 text-xs text-[#8C8176] flex justify-center gap-4">
          <Link href="/terms" className="hover:text-[#E07A28] transition-colors">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#E07A28] transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-[#E07A28] transition-colors">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
