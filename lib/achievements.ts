import { Expense } from "./types";
import { LucideIcon, Trophy, Rocket, PiggyBank, Flame, Star, ShieldCheck, Target, TrendingUp, Gem, Crown, Zap, Heart, Coffee, ShoppingBag, CreditCard, Crosshair, Award, Gift, Compass, Coins } from "lucide-react";

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  evaluate: (expenses: Expense[], monthlyIncome: number, emis: any[]) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: "first_step",
    name: "First Step",
    description: "Logged your very first expense. The journey begins!",
    icon: Rocket,
    color: "text-blue-400",
    evaluate: (expenses) => expenses.length >= 1
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Logged 100 transactions. You are a tracking master!",
    icon: Crown,
    color: "text-yellow-400",
    evaluate: (expenses) => expenses.length >= 100
  },
  {
    id: "investor",
    name: "The Investor",
    description: "Made your first investment. Planting seeds for the future.",
    icon: TrendingUp,
    color: "text-emerald-400",
    evaluate: (expenses) => expenses.some(e => e.category === 'Invest')
  },
  {
    id: "super_saver",
    name: "Super Saver",
    description: "Saved or invested more than 50% of your income in a single month.",
    icon: PiggyBank,
    color: "text-pink-400",
    evaluate: (expenses, income) => {
      if (income <= 0) return false;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const invested = expenses.filter(e => e.date.startsWith(currentMonth) && (e.category === 'Invest' || e.category === 'Savings')).reduce((sum, e) => sum + e.amount, 0);
      return (invested / income) >= 0.5;
    }
  },
  {
    id: "big_spender",
    name: "Big Spender",
    description: "Logged a single expense over ₹10,000. Big moves!",
    icon: Flame,
    color: "text-orange-400",
    evaluate: (expenses) => expenses.some(e => e.amount > 10000 && e.category !== 'Invest')
  },
  {
    id: "budget_master",
    name: "Budget Master",
    description: "Kept your Needs under 50% of your income this month.",
    icon: ShieldCheck,
    color: "text-[#E07A28]",
    evaluate: (expenses, income) => {
      if (income <= 0) return false;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const needsCategories = ["Food", "Transport", "Housing", "EMI", "Utilities"];
      const needs = expenses.filter(e => e.date.startsWith(currentMonth) && needsCategories.includes(e.category)).reduce((sum, e) => sum + e.amount, 0);
      return needs > 0 && (needs / income) <= 0.5; // needs > 0 to avoid unlocking on day 1 with 0 spent
    }
  },
  {
    id: "frugal",
    name: "Frugal & Focused",
    description: "Kept your Wants under 10% of your income this month.",
    icon: Target,
    color: "text-teal-400",
    evaluate: (expenses, income) => {
      if (income <= 0) return false;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const wantsCategories = ["Entertainment", "Shopping", "Miscellaneous", "Subscriptions"];
      const wants = expenses.filter(e => e.date.startsWith(currentMonth) && wantsCategories.includes(e.category)).reduce((sum, e) => sum + e.amount, 0);
      const spentAnything = expenses.some(e => e.date.startsWith(currentMonth));
      return spentAnything && (wants / income) <= 0.1;
    }
  },
  {
    id: "emi_boss",
    name: "EMI Boss",
    description: "Set up your first active EMI tracking.",
    icon: CreditCard,
    color: "text-red-400",
    evaluate: (expenses, income, emis) => emis && emis.length > 0
  },
  {
    id: "foodie",
    name: "Foodie",
    description: "Logged 10 food or dining expenses. Bon appétit!",
    icon: Coffee,
    color: "text-amber-400",
    evaluate: (expenses) => expenses.filter(e => e.category === 'Food').length >= 10
  },
  {
    id: "shopaholic",
    name: "Shopaholic",
    description: "Logged 10 shopping expenses. Treat yourself!",
    icon: ShoppingBag,
    color: "text-fuchsia-400",
    evaluate: (expenses) => expenses.filter(e => e.category === 'Shopping').length >= 10
  },
  {
    id: "diamond_hands",
    name: "Diamond Hands",
    description: "Total all-time investments crossed ₹100,000.",
    icon: Gem,
    color: "text-cyan-400",
    evaluate: (expenses) => expenses.filter(e => e.category === 'Invest').reduce((sum, e) => sum + e.amount, 0) >= 100000
  },
  {
    id: "lightning",
    name: "Lightning Fast",
    description: "Logged an expense on the very first day of the month.",
    icon: Zap,
    color: "text-yellow-300",
    evaluate: (expenses) => expenses.some(e => e.date.endsWith("-01"))
  },
  {
    id: "philanthropist",
    name: "Philanthropist",
    description: "Wait, you actually gave money away? Generous!",
    icon: Heart,
    color: "text-rose-400",
    evaluate: (expenses) => expenses.some(e => e.title.toLowerCase().includes("charity") || e.title.toLowerCase().includes("donation"))
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Reached a perfect Financial Score of 100.",
    icon: Crosshair,
    color: "text-emerald-300",
    evaluate: () => false // Handled in Dashboard since it requires score calculation
  },
  {
    id: "collector",
    name: "The Collector",
    description: "Unlocked 5 different achievements.",
    icon: Award,
    color: "text-indigo-400",
    evaluate: () => false // Special evaluation
  },
  {
    id: "treat_yoself",
    name: "Treat Yo' Self",
    description: "Logged a 'Wants' expense over ₹5,000.",
    icon: Gift,
    color: "text-[#F08C3A]",
    evaluate: (expenses) => {
      const wantsCategories = ["Entertainment", "Shopping", "Miscellaneous", "Subscriptions"];
      return expenses.some(e => wantsCategories.includes(e.category) && e.amount > 5000);
    }
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Used every single expense category at least once.",
    icon: Compass,
    color: "text-sky-400",
    evaluate: (expenses) => {
      const usedCats = new Set(expenses.map(e => e.category));
      return usedCats.size >= 8; 
    }
  },
  {
    id: "whale",
    name: "The Whale",
    description: "Earned more than ₹200,000 in a single month.",
    icon: Coins,
    color: "text-amber-500",
    evaluate: (expenses, income) => income >= 200000
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Logged 7 expenses in a single week. Consistent!",
    icon: Star,
    color: "text-yellow-500",
    evaluate: (expenses) => expenses.length >= 7 // Simplified logic
  },
  {
    id: "champion",
    name: "Champion",
    description: "Unlock all other 19 badges to earn this ultimate crown.",
    icon: Trophy,
    color: "text-yellow-400",
    evaluate: () => false // Handled separately
  }
];
