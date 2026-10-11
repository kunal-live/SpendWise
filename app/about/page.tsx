import Link from "next/link";
import { ArrowLeft, Sparkles, Shield, Target, TrendingUp, Zap, Heart, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "About | SpendWise",
  description: "About SpendWise - The modern personal finance OS"
};

export default function AboutPage() {
  const pillars = [
    {
      icon: Shield,
      title: "Privacy First",
      desc: "Zero tracking, no banking credential harvesting, and completely isolated user databases. Your finances are confidential."
    },
    {
      icon: Target,
      title: "50/30/20 Discipline",
      desc: "Scientific financial health budgeting. SpendWise classifies your outlays into Needs, Wants, and Investments with live scoring."
    },
    {
      icon: TrendingUp,
      title: "Actionable Insights",
      desc: "Accurate month-over-month comparisons, forecast models, and automated EMI tracking that give you complete monetary control."
    },
    {
      icon: Sparkles,
      title: "Gamified Milestones",
      desc: "Earn 20+ unlockable financial achievement badges as you crush your budget limits and grow your savings rate."
    }
  ];

  return (
    <div className="min-h-screen bg-[#121316] text-[#F6F2EB]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#382D25] bg-[#121316]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#8C8176] hover:text-[#F6F2EB] transition-colors">
            <ArrowLeft size={16} /> Back to SpendWise
          </Link>
          <div className="text-xl font-black tracking-tight text-[#F6F2EB]">
            SPEND<span className="text-[#E07A28]">WISE</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative border-b border-[#382D25] bg-gradient-to-b from-[#251C17] via-[#1D1815] to-transparent py-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E07A28]/30 bg-[#E07A28]/10 px-3.5 py-1 text-xs font-semibold text-[#E07A28] mb-6">
            <Sparkles size={14} /> The Personal Finance OS
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#F6F2EB] md:text-6xl">
            Built for clarity, discipline, &amp; <span className="text-[#E07A28]">wealth</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#C6BCB3] leading-relaxed">
            SpendWise transforms clunky spreadsheets into an ultra-fast, visually stunning financial command center engineered for modern professionals and students.
          </p>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        
        {/* Core Pillars */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-[#F6F2EB]">Why SpendWise?</h2>
            <p className="mt-2 text-xs text-[#8C8176]">Designed with deliberate editorial precision and uncompromising data security.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="rounded-3xl border border-[#382D25] bg-[#1D1815] p-7 shadow-sm hover:border-[#E07A28]/40 transition-all">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E07A28]/15 text-[#E07A28] mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-[#F6F2EB] mb-2">{pillar.title}</h3>
                  <p className="text-sm text-[#C6BCB3] leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="mt-16 rounded-3xl border border-[#E07A28]/25 bg-gradient-to-br from-[#241B16] via-[#1D1815] to-[#17181C] p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black text-[#F6F2EB]">Never wonder where your salary went again.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#C6BCB3]">
              With multi-channel category categorization (UPI, Card, Cash, Bank), instant auto-deducting EMI schedules, and intelligent month-over-month growth comparisons that activate as your history expands, SpendWise empowers you to make proactive money decisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/" className="rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-6 py-3 text-sm font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#E07A28]/25">
                Launch Dashboard
              </Link>
              <Link href="/contact" className="rounded-xl border border-[#382D25] bg-[#1D1815] px-6 py-3 text-sm font-semibold text-[#F6F2EB] hover:border-[#E07A28]/40 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#382D25] pt-6 text-xs text-[#8C8176]">
          <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#E07A28] transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-[#E07A28] transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-[#E07A28] transition-colors">Disclaimer</Link>
            <Link href="/contact" className="hover:text-[#E07A28] transition-colors">Support &amp; FAQ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
