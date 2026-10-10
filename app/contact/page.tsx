"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  Send, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does SpendWise calculate my 50/30/20 financial score?",
      a: "SpendWise tracks your total monthly income against your categorized expenses. Following the gold standard 50/30/20 rule: 50% for Needs (Groceries, EMI, Rent, Utilities), 30% for Wants (Dining out, Shopping, Subscriptions), and 20% for Savings & Investments (SIPs, Emergency fund). Your score updates live based on your adherence to these ratios."
    },
    {
      q: "Why do I not see a previous month comparison in my dashboard?",
      a: "If you are a new user or just created your account this month, SpendWise does not show artificial or misleading 0% comparison metrics. As soon as you track through your second month, month-over-month graphs, spending deltas, and savings growth comparisons will automatically unlock."
    },
    {
      q: "Is my financial information secure and private?",
      a: "Yes. SpendWise operates on privacy-first architecture. We never request your bank passwords, UPI PINs, or card details. Your data is isolated per user account and secured with database-level encryption."
    },
    {
      q: "How do automated EMI deductions work?",
      a: "When you add an EMI with a specific deduction date (e.g. Day 5), SpendWise automatically adds the monthly installment expense on that date of each month, keeping your records accurate without manual daily entries."
    },
    {
      q: "How can I export or reset my data?",
      a: "Navigate to Settings inside your dashboard where you can manage your profile or click 'Factory Reset Data' to completely wipe all local and synchronized data."
    }
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 800);
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#45423E]">
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
      <div className="relative border-b border-[#E5DFD3] bg-gradient-to-b from-[#FF6B4A]/10 via-[#FFFDF9]/60 to-transparent py-14 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#FF6B4A]/10 text-[#FF6B4A] ring-1 ring-[#FF6B4A]/25">
            <MessageSquare size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#14151A] md:text-5xl">Help &amp; Support</h1>
          <p className="mt-3 text-sm text-[#7A756D]">
            Have a question or feedback? We&apos;re here to help you get the most out of SpendWise.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#14151A] mb-1">Send us a message</h2>
              <p className="text-xs text-[#7A756D] mb-6">Our product and support team typically responds within 24 hours.</p>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-800">Message Received!</h3>
                  <p className="mt-2 text-xs text-[#45423E]">Thank you for reaching out. We have received your inquiry and will reply shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-5 rounded-xl bg-[#F4EFE6] border border-[#E5DFD3] px-4 py-2 text-xs font-semibold text-[#14151A] hover:bg-[#EAE4D7] transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#7A756D] mb-1.5">Your Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-4 py-3 text-sm text-[#14151A] placeholder-[#7A756D] outline-none focus:border-[#FF6B4A] focus:bg-[#FFFDF9] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#7A756D] mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="you@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-4 py-3 text-sm text-[#14151A] placeholder-[#7A756D] outline-none focus:border-[#FF6B4A] focus:bg-[#FFFDF9] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#7A756D] mb-1.5">Subject</label>
                    <input 
                      type="text" 
                      placeholder="Feedback / Feature Request / Account Question" 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-4 py-3 text-sm text-[#14151A] placeholder-[#7A756D] outline-none focus:border-[#FF6B4A] focus:bg-[#FFFDF9] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#7A756D] mb-1.5">Message</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="How can we help you?" 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-4 py-3 text-sm text-[#14151A] placeholder-[#7A756D] outline-none focus:border-[#FF6B4A] focus:bg-[#FFFDF9] transition-all resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5733] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B4A]/25 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? "Sending..." : (
                      <>
                        <Send size={16} /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Direct Email Card */}
            <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 flex items-center gap-4 shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FF6B4A]/10 text-[#FF6B4A] shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-xs text-[#7A756D] uppercase tracking-wider font-semibold">Direct Email Support</div>
                <a href="mailto:support@spendwise.app" className="text-sm font-bold text-[#14151A] hover:text-[#FF6B4A] transition-colors">
                  support@spendwise.app
                </a>
              </div>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="text-[#FF6B4A]" size={20} />
              <h2 className="text-xl font-bold text-[#14151A]">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index}
                    className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] overflow-hidden transition-colors shadow-sm"
                  >
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-5 text-left font-semibold text-sm text-[#14151A] hover:text-[#FF6B4A] transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} className="shrink-0 text-[#FF6B4A] ml-2" /> : <ChevronDown size={16} className="shrink-0 text-[#7A756D] ml-2" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs leading-relaxed text-[#45423E] border-t border-[#E5DFD3]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5DFD3] pt-6 text-xs text-[#7A756D]">
          <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#FF6B4A] transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-[#FF6B4A] transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-[#FF6B4A] transition-colors">Disclaimer</Link>
            <Link href="/about" className="hover:text-[#FF6B4A] transition-colors">About</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
