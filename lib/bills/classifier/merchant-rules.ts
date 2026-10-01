/**
 * Layer 1 — Merchant Mapping Rules
 * Fast and deterministic mapping of known merchants to their default categories.
 */

export interface MerchantRule {
  pattern: RegExp;
  category: string;
  confidence: number;
}

export const MERCHANT_CATEGORY_RULES: MerchantRule[] = [
  // Transport & Rides
  { pattern: /\b(uber|ola(\s+cabs)?|rapido|blusmart|meru|metro|fastag|irctc|redbus)\b/i, category: "Transport", confidence: 0.96 },
  { pattern: /\b(petrol|diesel|fuel|hpcl|bpcl|iocl|shell|indian\s*oil)\b/i, category: "Transport", confidence: 0.95 },

  // Food & Dining & Food Delivery
  { pattern: /\b(swiggy|zomato|eatsure|faasos|behrouz|ovenstory)\b/i, category: "Food", confidence: 0.95 },
  { pattern: /\b(mcdonald'?s|burger\s*king|domino'?s|pizza\s*hut|kfc|subway|wendy'?s|starbucks|cafe\s*coffee\s*day|ccd|chaayos|chai\s*point|haldiram|bikanervala|barbeque\s*nation)\b/i, category: "Food", confidence: 0.96 },

  // Groceries & Quick Commerce
  { pattern: /\b(zepto|blinkit|instamart|bigbasket|bb\s*now|dmart|nature'?s\s*basket|spencer'?s|more\s*retail|reliance\s*fresh|reliance\s*smart|country\s*delight|dunzo)\b/i, category: "Groceries", confidence: 0.95 },

  // Streaming & Digital Subscriptions
  { pattern: /\b(netflix|spotify|prime\s*video|disney\+?\s*hotstar|hotstar|youtube\s*premium|apple\s*music|audible|gaana|jiosaavn|zee5|sonyliv|sony\s*liv|openai|chatgpt|github)\b/i, category: "Subscriptions", confidence: 0.96 },

  // Healthcare & Pharmacy
  { pattern: /\b(apollo\s*pharmacy|pharmeasy|1mg|tata\s*1mg|medplus|netmeds|practo|max\s*healthcare|fortis|manipal|dr\s*lal\s*pathlabs|metropolis)\b/i, category: "Healthcare", confidence: 0.96 },

  // Travel & Accommodation
  { pattern: /\b(makemytrip|goibibo|cleartrip|yatra|easemytrip|agoda|booking\.com|airbnb|oyo|indigo|air\s*india|spicejet|vistara|akasa\s*air)\b/i, category: "Travel", confidence: 0.95 },

  // Bills & Utilities
  { pattern: /\b(bescom|tatapower|adani\s*electricity|tneb|torrent\s*power|airtel|jio|vi\b|vodafone|bsnl|act\s*fibernet|tata\s*play|dish\s*tv|mahanagar\s*gas|igl|indraprastha\s*gas)\b/i, category: "Bills & Utilities", confidence: 0.95 },

  // Clothing & Apparel Merchants (specific fashion retailers)
  { pattern: /\b(zara|h&m|uniqlo|levi'?s|myntra|ajio|marks\s*&\s*spencer|westside|pantaloons|trends|lifestyle|max\s*fashion|fabindia|snitch)\b/i, category: "Clothing", confidence: 0.95 },

  // Electronics Merchants (specific hardware stores)
  { pattern: /\b(croma|reliance\s*digital|vijay\s*sales|apple\s*store|imagine|lenovo|dell|hp\s*world|samsung\s*smart\s*cafe)\b/i, category: "Electronics", confidence: 0.95 },

  // Education
  { pattern: /\b(coursera|udemy|edx|unacademy|byju'?s|upgrad|simplilearn|duolingo|codecademy)\b/i, category: "Education", confidence: 0.95 },

  // Entertainment
  { pattern: /\b(pvr|inox|cinepolis|bookmyshow|ticketnew|carnival\s*cinemas|gaming|smaaash|timezone)\b/i, category: "Entertainment", confidence: 0.95 }
];

/**
 * Multi-category retailers (e.g. Amazon, Flipkart, Walmart, Target, Reliance Retail)
 * Must NOT be classified solely by merchant name!
 */
export const MULTI_CATEGORY_MERCHANTS = [
  "amazon",
  "flipkart",
  "walmart",
  "target",
  "tata cliq",
  "tatacliq",
  "meesho",
  "ebay",
  "reliance retail"
];

export function isMultiCategoryMerchant(merchant: string): boolean {
  if (!merchant) return false;
  const clean = merchant.trim().toLowerCase();
  return MULTI_CATEGORY_MERCHANTS.some(m => clean.includes(m));
}

export function matchMerchantRule(merchant: string): { category: string; confidence: number } | null {
  if (!merchant) return null;
  // If merchant is a multi-category marketplace (like Amazon or Flipkart), skip Layer 1 merchant rule
  // so item keywords determine the category!
  if (isMultiCategoryMerchant(merchant)) {
    return null;
  }

  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.pattern.test(merchant)) {
      return { category: rule.category, confidence: rule.confidence };
    }
  }

  return null;
}
