import { MerchantAlias } from "@/lib/types";

export interface NormalizedMerchantResult {
  merchant: string;
  cleanedDescription: string;
  suggestedCategory?: string;
  isKnownMerchant: boolean;
}

const DEFAULT_ALIASES: Array<{ canonical: string; pattern: RegExp; category?: string }> = [
  { canonical: "Swiggy", pattern: /\b(swiggy|bundl technologies)\b/i, category: "Food" },
  { canonical: "Zomato", pattern: /\b(zomato)\b/i, category: "Food" },
  { canonical: "Blinkit", pattern: /\b(blinkit|grofers)\b/i, category: "Groceries" },
  { canonical: "Zepto", pattern: /\b(zepto|kiranakart)\b/i, category: "Groceries" },
  { canonical: "Instamart", pattern: /\b(instamart)\b/i, category: "Groceries" },
  { canonical: "BigBasket", pattern: /\b(bigbasket|supermarket grocery)\b/i, category: "Groceries" },
  { canonical: "Uber", pattern: /\b(uber)\b/i, category: "Transport" },
  { canonical: "Ola", pattern: /\b(ola|ani technologies)\b/i, category: "Transport" },
  { canonical: "Rapido", pattern: /\b(rapido|roppen)\b/i, category: "Transport" },
  { canonical: "Amazon", pattern: /\b(amazon|amzn)\b/i, category: "Shopping" },
  { canonical: "Flipkart", pattern: /\b(flipkart)\b/i, category: "Shopping" },
  { canonical: "Myntra", pattern: /\b(myntra)\b/i, category: "Clothing" },
  { canonical: "Zara", pattern: /\b(zara)\b/i, category: "Clothing" },
  { canonical: "H&M", pattern: /\b(h&m|hennes)\b/i, category: "Clothing" },
  { canonical: "Uniqlo", pattern: /\b(uniqlo)\b/i, category: "Clothing" },
  { canonical: "Croma", pattern: /\b(croma|infiniti retail)\b/i, category: "Electronics" },
  { canonical: "Reliance Digital", pattern: /\b(reliance digital)\b/i, category: "Electronics" },
  { canonical: "Apple", pattern: /\b(apple|itunes|app store)\b/i, category: "Electronics" },
  { canonical: "Netflix", pattern: /\b(netflix)\b/i, category: "Subscriptions" },
  { canonical: "Spotify", pattern: /\b(spotify)\b/i, category: "Subscriptions" },
  { canonical: "YouTube Premium", pattern: /\b(youtube|google youtube)\b/i, category: "Subscriptions" },
  { canonical: "Disney+ Hotstar", pattern: /\b(hotstar|disney hotstar|novi digital)\b/i, category: "Subscriptions" },
  { canonical: "Apollo Pharmacy", pattern: /\b(apollo pharmacy|apollo pharmacies)\b/i, category: "Healthcare" },
  { canonical: "Tata 1mg", pattern: /\b(1mg|tata 1mg)\b/i, category: "Healthcare" },
  { canonical: "MedPlus", pattern: /\b(medplus|optival health)\b/i, category: "Healthcare" },
  { canonical: "PharmEasy", pattern: /\b(pharmeasy|axelia solutions)\b/i, category: "Healthcare" },
  { canonical: "MakeMyTrip", pattern: /\b(makemytrip|mmt)\b/i, category: "Travel" },
  { canonical: "Goibibo", pattern: /\b(goibibo|ibibo)\b/i, category: "Travel" },
  { canonical: "IndiGo", pattern: /\b(indigo|interglobe aviation)\b/i, category: "Travel" },
  { canonical: "Air India", pattern: /\b(air india)\b/i, category: "Travel" },
  { canonical: "IRCTC", pattern: /\b(irctc|indian railway)\b/i, category: "Travel" },
  { canonical: "Airtel", pattern: /\b(airtel|bharti airtel)\b/i, category: "Bills & Utilities" },
  { canonical: "Jio", pattern: /\b(jio|reliance jio)\b/i, category: "Bills & Utilities" },
  { canonical: "BESCOM", pattern: /\b(bescom)\b/i, category: "Bills & Utilities" },
  { canonical: "Tata Power", pattern: /\b(tata power)\b/i, category: "Bills & Utilities" },
  { canonical: "Starbucks", pattern: /\b(starbucks|tata starbucks)\b/i, category: "Food" },
  { canonical: "McDonald's", pattern: /\b(mcdonalds|mcdonald's|hardcastle)\b/i, category: "Food" },
  { canonical: "Domino's", pattern: /\b(dominos|domino's|jubilant foodworks)\b/i, category: "Food" },
  { canonical: "KFC", pattern: /\b(kfc|devyani international)\b/i, category: "Food" },
  { canonical: "Subway", pattern: /\b(subway)\b/i, category: "Food" },
  { canonical: "Zerodha", pattern: /\b(zerodha)\b/i, category: "Invest" },
  { canonical: "Groww", pattern: /\b(groww|nextbillion)\b/i, category: "Invest" },
  { canonical: "Cred", pattern: /\b(cred|dreamplug)\b/i, category: "Other" }
];

/**
 * Normalizes dirty bank description into canonical merchant and clean title.
 */
export function normalizeMerchant(
  rawDescription: string,
  userAliases: MerchantAlias[] = []
): NormalizedMerchantResult {
  const original = rawDescription.trim();

  // 1. Strip common bank prefixes: "UPI-", "POS-", "IMPS-", "NEFT-", "ACH-", "NACH-"
  let cleaned = original
    .replace(/^(UPI|POS|IMPS|NEFT|ACH|NACH|RTGS|ECOM|BBPS|CMS)[\s/:-]+/i, "")
    .replace(/^REV-(UPI|POS|IMPS)[\s/:-]+/i, "")
    .replace(/^PUR[\s/:-]+/i, "")
    .trim();

  // 2. Strip transaction IDs, dates, UPI handles from cleaned text:
  // e.g. "SWIGGY-12345678@icici-Order" -> "SWIGGY"
  const upiHandleIdx = cleaned.indexOf("@");
  if (upiHandleIdx > 0) {
    const beforeAt = cleaned.slice(0, upiHandleIdx);
    const parts = beforeAt.split(/[-/]/);
    cleaned = parts[0] || cleaned;
  }

  // Check user aliases first
  const lowerOriginal = original.toLowerCase();
  const lowerCleaned = cleaned.toLowerCase();

  for (const ua of userAliases) {
    const aliasLower = ua.alias.toLowerCase();
    if (lowerOriginal.includes(aliasLower) || lowerCleaned.includes(aliasLower)) {
      return {
        merchant: ua.canonical_merchant,
        cleanedDescription: ua.canonical_merchant,
        suggestedCategory: ua.category_name,
        isKnownMerchant: true
      };
    }
  }

  // Check default alias rules
  for (const alias of DEFAULT_ALIASES) {
    if (alias.pattern.test(original) || alias.pattern.test(cleaned)) {
      return {
        merchant: alias.canonical,
        cleanedDescription: alias.canonical,
        suggestedCategory: alias.category,
        isKnownMerchant: true
      };
    }
  }

  // Fallback: extract cleanest alphabetic token from narration
  const tokenMatch = cleaned.match(/[A-Za-z0-9&'.\s]{3,35}/);
  const fallbackMerchant = tokenMatch 
    ? tokenMatch[0].replace(/\b(pvt|ltd|limited|india|technologies|services|pay|retail|store|online)\b/gi, "").trim()
    : cleaned.slice(0, 30);

  const formatted = fallbackMerchant
    ? fallbackMerchant.charAt(0).toUpperCase() + fallbackMerchant.slice(1)
    : "Transaction";

  return {
    merchant: formatted,
    cleanedDescription: formatted,
    isKnownMerchant: false
  };
}
