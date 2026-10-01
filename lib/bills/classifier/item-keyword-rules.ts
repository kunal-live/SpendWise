/**
 * Layer 2 — Item Keyword Rules
 * Detailed keyword matching on purchased item names and receipt line descriptions.
 */

export interface KeywordRule {
  category: string;
  weight: number;
  keywords: string[];
}

export const ITEM_KEYWORD_RULES: KeywordRule[] = [
  {
    category: "Clothing",
    weight: 1.0,
    keywords: [
      "shirt", "t-shirt", "tshirt", "jeans", "trousers", "pants", "kurta", "kurti", "saree", "dress",
      "jacket", "coat", "hoodie", "sweater", "sweatshirt", "shorts", "boxers", "briefs", "underwear",
      "socks", "shoes", "sneakers", "boots", "sandals", "slippers", "heels", "flip-flops", "chappal",
      "blazer", "suit", "tie", "belt", "scarf", "gloves", "cap", "hat", "sunglasses", "swimwear",
      "nike", "adidas", "puma", "reebok", "under armour", "zara", "h&m", "levis", "wrangler", "denim",
      "apparel", "garment", "cotton", "linen", "polyester", "silk", "wool"
    ]
  },
  {
    category: "Electronics",
    weight: 1.0,
    keywords: [
      "keyboard", "mouse", "monitor", "laptop", "desktop", "computer", "macbook", "ipad", "tablet",
      "headphones", "earphones", "earbuds", "airpods", "speaker", "bluetooth", "charger", "adapter",
      "cable", "type-c", "lightning", "hdmi", "usb", "pendrive", "flash drive", "ssd", "hard disk", "hdd",
      "ram", "gpu", "processor", "motherboard", "router", "modem", "wifi", "webcam", "microphone",
      "smartwatch", "fitness band", "smart band", "phone", "smartphone", "iphone", "samsung galaxy",
      "oneplus", "screen guard", "tempered glass", "phone case", "cover", "power bank", "extension cord",
      "logitech", "dell", "hp", "lenovo", "asus", "acer", "sony", "bose", "jbl", "boat", "noise"
    ]
  },
  {
    category: "Food",
    weight: 1.0,
    keywords: [
      "pizza", "burger", "sandwich", "pasta", "noodles", "biryani", "fried rice", "thali", "dosa",
      "idli", "vada", "paneer butter masala", "chicken", "mutton", "fish", "curry", "roti", "naan", "paratha",
      "dal makhani", "chowmein", "momos", "tacos", "burrito", "salad", "soup", "dessert", "ice cream",
      "cake", "pastry", "brownie", "coffee", "cappuccino", "latte", "espresso", "tea", "chai", "shake",
      "smoothie", "mocktail", "meal", "combo", "dine-in", "takeaway", "delivery charge", "restaurant",
      "cafe", "bistro", "dhaba", "food court", "garlic bread", "farmhouse", "crust", "food"
    ]
  },
  {
    category: "Groceries",
    weight: 0.95,
    keywords: [
      "atta", "flour", "rice", "basmati", "dal", "toor dal", "moong", "chana", "sugar", "salt", "oil",
      "mustard oil", "sunflower oil", "ghee", "butter", "milk", "curd", "yogurt", "paneer", "cheese",
      "white bread", "brown bread", "eggs", "vegetables", "fruits", "potato", "onion", "tomato", "ginger", "garlic", "chilli",
      "coriander", "apple", "banana", "mango", "orange", "spinach", "spices", "masala", "turmeric",
      "tea powder", "coffee beans", "ketchup", "mayonnaise", "jam", "biscuits", "cookies", "chips",
      "namkeen", "snack", "detergent", "surf excel", "ariel", "vim", "dishwash", "harpic", "colgate",
      "toothpaste", "soap", "shampoo", "toilet paper", "tissue", "trash bags", "provisions", "grocery"
    ]
  },
  {
    category: "Healthcare",
    weight: 1.0,
    keywords: [
      "tablet", "capsule", "syrup", "ointment", "drops", "injection", "paracetamol", "crocin", "dolo",
      "azithromycin", "antibiotic", "antacid", "vitamin", "multivitamin", "zinc", "calcium", "omega-3",
      "pain relief", "bandage", "bandaid", "cotton", "gauze", "antiseptic", "dettol", "savlon", "thermometer",
      "bp monitor", "oximeter", "mask", "sanitizer", "consultation", "doctor", "physician", "clinic",
      "hospital", "prescription", "lab test", "blood test", "x-ray", "mri", "scan", "pharmacy", "medical"
    ]
  },
  {
    category: "Transport",
    weight: 0.95,
    keywords: [
      "ride", "trip", "fare", "toll", "parking", "petrol", "diesel", "cng", "fuel", "gasoline", "cab",
      "taxi", "auto", "rickshaw", "bus", "train", "metro", "smart card", "recharge fastag", "driver allowance",
      "vehicle maintenance", "car wash", "puncture", "tyre", "engine oil"
    ]
  },
  {
    category: "Entertainment",
    weight: 0.95,
    keywords: [
      "movie", "cinema", "theatre", "imax", "pvr", "inox", "popcorn", "coke combo", "recliner",
      "concert", "show", "amusement park", "water park", "bowling", "arcade", "game", "gaming center",
      "karting", "paintball", "museum", "circus", "standup comedy", "event pass"
    ]
  },
  {
    category: "Bills & Utilities",
    weight: 0.95,
    keywords: [
      "electricity bill", "power", "water bill", "piped gas", "gas cylinder", "lpg", "broadband", "fiber",
      "wifi bill", "landline", "postpaid", "prepaid recharge", "mobile bill", "dth", "cable tv",
      "maintenance charge", "society bill", "property tax", "municipal"
    ]
  },
  {
    category: "Travel",
    weight: 1.0,
    keywords: [
      "flight", "airfare", "boarding pass", "airline", "hotel", "resort", "homestay", "room booking",
      "night stay", "check-in", "baggage fee", "seat selection", "train ticket", "tatkal", "sleeper",
      "ac 3 tier", "tour", "package", "visa fee", "travel insurance"
    ]
  },
  {
    category: "Education",
    weight: 0.95,
    keywords: [
      "course", "tuition", "coaching", "school fee", "college fee", "semester", "exam fee",
      "textbook", "notebook", "stationery", "certification", "training", "workshop", "webinar",
      "subscription learning", "library"
    ]
  },
  {
    category: "Subscriptions",
    weight: 0.95,
    keywords: [
      "monthly plan", "annual plan", "membership", "premium subscription", "vip pass", "auto-renewal",
      "recurring billing", "cloud storage", "software license", "saas"
    ]
  },
  {
    category: "Shopping",
    weight: 0.7,
    keywords: [
      "watch", "perfume", "deodorant", "cologne", "cosmetics", "makeup", "lipstick", "lotion", "cream",
      "backpack", "wallet", "handbag", "luggage", "suitcase", "furniture", "home decor", "curtains",
      "cushion", "bedsheet", "pillow", "kitchenware", "pan", "cooker", "bottle", "gift", "toy"
    ]
  }
];

export interface KeywordMatchResult {
  category: string;
  score: number;
  matchedKeywords: string[];
}

/**
 * Score item keywords against candidate categories
 */
export function matchItemKeywords(items: Array<{ name: string }>, fullText?: string): KeywordMatchResult | null {
  const combinedText = [
    ...items.map(i => i.name.toLowerCase()),
    (fullText || "").toLowerCase()
  ].join(" ");

  if (!combinedText.trim()) return null;

  const scores: Record<string, { score: number; matched: string[] }> = {};

  for (const rule of ITEM_KEYWORD_RULES) {
    let matchCount = 0;
    const matched: string[] = [];

    for (const kw of rule.keywords) {
      // Use regex word boundary where possible
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
      if (regex.test(combinedText)) {
        matchCount += 1;
        matched.push(kw);
      }
    }

    if (matchCount > 0) {
      scores[rule.category] = {
        score: matchCount * rule.weight,
        matched
      };
    }
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  // Sort descending by score
  entries.sort((a, b) => b[1].score - a[1].score);

  const [bestCategory, bestData] = entries[0];
  return {
    category: bestCategory,
    score: bestData.score,
    matchedKeywords: bestData.matched
  };
}
