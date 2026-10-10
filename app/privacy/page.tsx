import Link from "next/link";
import { ArrowLeft, Shield, Lock, EyeOff, Database, Key } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | SpendWise",
  description: "SpendWise Privacy Policy and User Data Protection Standards"
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#14151A]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5DFD3] bg-[#FAF6EE]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#7A756D] hover:text-[#14151A] transition-colors">
            <ArrowLeft size={16} /> Back to SpendWise
          </Link>
          <div className="text-xl font-black tracking-tight text-[#14151A]">
            SPEND<span className="text-[#FF6B4A]">WISE</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative border-b border-[#E5DFD3] bg-gradient-to-b from-[#FFF2EE] via-[#FFFDF9] to-transparent py-14 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#FF6B4A]/15 text-[#FF6B4A] ring-1 ring-[#FF6B4A]/30">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#14151A] md:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-[#7A756D]">
            Effective Date: September 2026 • Your financial privacy and data integrity are our highest priority.
          </p>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-10 rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-6 md:p-10 shadow-sm">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">1.</span> Privacy Commitment
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              At SpendWise, we firmly believe your personal finances are your own business. We design our architecture around privacy-first principles: minimal data collection, transparent storage, strict isolation between user accounts, and zero selling or monetization of personal transaction records.
            </p>
          </section>

          {/* Core Guarantees Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E5DFD3] bg-[#F7F2E7] p-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF6B4A]/15 text-[#FF6B4A] mb-3">
                <EyeOff size={18} />
              </div>
              <h3 className="font-bold text-[#14151A] text-sm">No Bank Credentials</h3>
              <p className="mt-1 text-xs text-[#7A756D] leading-relaxed">
                We never ask for your net banking passwords, UPI PINs, OTPs, or credit card CVVs.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DFD3] bg-[#F7F2E7] p-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 mb-3">
                <Lock size={18} />
              </div>
              <h3 className="font-bold text-[#14151A] text-sm">End-to-End Isolation</h3>
              <p className="mt-1 text-xs text-[#7A756D] leading-relaxed">
                Every user&apos;s data is scoped individually. No user can ever see another account&apos;s financial records.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DFD3] bg-[#F7F2E7] p-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF6B4A]/15 text-[#FF6B4A] mb-3">
                <Database size={18} />
              </div>
              <h3 className="font-bold text-[#14151A] text-sm">Full Data Control</h3>
              <p className="mt-1 text-xs text-[#7A756D] leading-relaxed">
                You can delete, reset, or wipe your data at any time with a single click in Settings.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">2.</span> Information We Collect
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              We only collect information necessary to operate your personalized finance workspace:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#45423E]">
              <li>
                <strong className="text-[#14151A]">Account Credentials:</strong> Email address, chosen username, and encrypted password hash (or Google OAuth profile ID if signing in with Google).
              </li>
              <li>
                <strong className="text-[#14151A]">Financial Inputs:</strong> Monthly income, expense records, categories, payment methods (e.g. UPI, Cash, Card), investment allocations, and EMI details entered manually by you.
              </li>
              <li>
                <strong className="text-[#14151A]">Profile Preferences:</strong> Optional age, occupation, date of birth, and user archetype (Student vs Professional) used solely to calibrate your 50/30/20 financial health scores and savings tips.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">3.</span> How We Use Your Information
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              Your data is used strictly for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#45423E]">
              <li>Generating your interactive charts, spending trends, and category breakdowns.</li>
              <li>Calculating your adherence to the 50/30/20 budgeting rule and unlocking milestone badges.</li>
              <li>Executing auto-deduction reminders on your scheduled EMI dates.</li>
              <li>Authenticating your active sessions and maintaining your offline/online workspace state.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">4.</span> Storage &amp; Encryption
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              SpendWise leverages high-grade encrypted database connections (PostgreSQL over SSL/TLS) and secure client-side browser storage (localStorage with user-scoped isolation keys). Sensitive credentials like passwords are treated with modern cryptographic hashing algorithms before being stored.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">5.</span> Third-Party Services
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              We do not sell, rent, or trade your data to data brokers or third-party advertisers. We only integrate with essential infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#45423E]">
              <li><strong className="text-[#14151A]">Supabase:</strong> For secure database management and encrypted authentication.</li>
              <li><strong className="text-[#14151A]">Cloudflare:</strong> For secure edge caching, DDoS protection, and SSL termination.</li>
              <li><strong className="text-[#14151A]">Google OAuth (Optional):</strong> For one-click authentication if you choose to sign in with Google.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">6.</span> Your Rights &amp; Data Deletion
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              You maintain complete authority over your records. You can:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#45423E]">
              <li>Update your income, investments, and expenses at any time.</li>
              <li>Wipe all local and synced data using the &quot;Factory Reset Data&quot; option in Settings.</li>
              <li>Request complete account deletion and data purging by contacting support.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">7.</span> Contact the Privacy Officer
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              For any privacy-related questions or data requests, write to us at{" "}
              <Link href="/contact" className="text-[#FF6B4A] hover:underline">
                privacy@spendwise.app
              </Link>.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5DFD3] pt-6 text-xs text-[#7A756D]">
          <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#FF6B4A] transition-colors">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-[#FF6B4A] transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-[#FF6B4A] transition-colors">Contact Support</Link>
            <Link href="/about" className="hover:text-[#FF6B4A] transition-colors">About</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
