import Link from "next/link";
import { ArrowLeft, Shield, FileText, CheckCircle, Scale, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | SpendWise",
  description: "SpendWise Terms of Service and Conditions of Use"
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#45423E]">
      {/* Header / Navbar */}
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

      {/* Hero Banner */}
      <div className="relative border-b border-[#E5DFD3] bg-gradient-to-b from-[#FF6B4A]/10 via-[#FFFDF9]/60 to-transparent py-14 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#FF6B4A]/10 text-[#FF6B4A] ring-1 ring-[#FF6B4A]/25">
            <Scale size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#14151A] md:text-5xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-[#7A756D]">
            Last Updated: September 2026 • Please read these terms carefully before using SpendWise.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-10 rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-6 md:p-10 shadow-sm">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">1.</span> Acceptance of Terms
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              By accessing, browsing, registering for, or using SpendWise (&quot;the Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you confirm that you have read, understood, and agreed to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, you must not use or access the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">2.</span> Description of the Service
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              SpendWise is a personal finance management tool designed to help users track expenses, plan budgets, record EMIs, and monitor financial milestones based on the 50/30/20 budgeting rule. The Service provides analytics, dashboards, and automated deduction reminders based entirely on user-inputted records and preferences.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">3.</span> No Financial or Legal Advice
            </h2>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-900 leading-relaxed flex items-start gap-3">
              <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
              <div>
                <strong>Important Notice:</strong> SpendWise is an expense tracking and analytical utility for informational and educational purposes only. SpendWise is not a registered investment advisor, bank, or certified financial planner. All insights, scores, savings forecasts, and categorization metrics are estimates and should not be construed as investment, tax, or financial advice.
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">4.</span> User Accounts &amp; Security
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              To utilize certain features of SpendWise, you may create an account using an email, username, or OAuth provider (such as Google). You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use or breach of security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">5.</span> User Data &amp; Privacy
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              Your financial privacy is paramount. SpendWise does not ask for your banking passwords, net-banking PINs, or credit card CVV numbers. We process your data in accordance with our <Link href="/privacy" className="text-[#FF6B4A] hover:underline font-semibold">Privacy Policy</Link>. You retain full ownership of any data and transaction records you submit to the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">6.</span> Acceptable Use Policy
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              You agree not to misuse the Platform, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#45423E]">
              <li>Attempting to probe, scan, or reverse-engineer any part of the system or database.</li>
              <li>Impersonating another individual or registering multiple fraudulent accounts.</li>
              <li>Introducing malicious code, viruses, or automated scraping scripts.</li>
              <li>Violating any applicable local, state, national, or international laws.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">7.</span> Limitation of Liability
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              To the fullest extent permitted by applicable law, SpendWise, its creators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data loss, or financial losses arising from your reliance on the tools and metrics provided by the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">8.</span> Modifications to Terms
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              We reserve the right to amend or replace these Terms at any time. Significant changes will be announced on the Platform. Your continued use of SpendWise following any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#14151A] flex items-center gap-2">
              <span className="text-[#FF6B4A]">9.</span> Contact Information
            </h2>
            <p className="text-sm leading-relaxed text-[#45423E]">
              If you have any questions or concerns about these Terms, please contact our support team at{" "}
              <Link href="/contact" className="text-[#FF6B4A] hover:underline font-semibold">
                support@spendwise.app
              </Link>{" "}
              or via our <Link href="/contact" className="text-[#FF6B4A] hover:underline font-semibold">Contact Center</Link>.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5DFD3] pt-6 text-xs text-[#7A756D]">
          <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#FF6B4A] transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-[#FF6B4A] transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-[#FF6B4A] transition-colors">Contact Support</Link>
            <Link href="/about" className="hover:text-[#FF6B4A] transition-colors">About</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
