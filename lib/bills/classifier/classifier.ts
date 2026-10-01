import { matchMerchantRule, isMultiCategoryMerchant } from "./merchant-rules";
import { matchItemKeywords } from "./item-keyword-rules";
import { normalizeCategoryName, isValidCategory } from "./categories";

export interface ClassificationInput {
  merchant?: string;
  items?: Array<{ name: string; quantity?: number; unit_price?: number; total_price?: number }>;
  billText?: string;
  total?: number;
  userCorrections?: Array<{
    merchant?: string;
    itemSummary?: string;
    originalCategory: string;
    correctedCategory: string;
  }>;
}

export interface ClassificationOutput {
  category: string;
  confidence: number; // 0.00 to 1.00
  confidence_level: "high" | "medium" | "low";
  reason: string;
  matchedBy: "user_correction" | "item_keywords" | "merchant_rule" | "ai_fallback" | "default";
}

/**
 * Layered Category Classification Engine
 *
 * Precedence:
 * 1. User corrections (learned preferences)
 * 2. Item keywords (prioritized over merchant name for multi-category sellers like Amazon)
 * 3. Merchant mapping rules (for dedicated merchants like Swiggy, Uber, Netflix)
 * 4. Contextual AI/Heuristic classifier
 * 5. Default fallback
 */
export function classifyExpenseCategory(input: ClassificationInput): ClassificationOutput {
  const merchant = (input.merchant || "").trim();
  const items = input.items || [];
  const billText = input.billText || "";
  const userCorrections = input.userCorrections || [];

  // =========================================================================
  // Layer 0: User's Previous Corrections (Personalized Learning)
  // =========================================================================
  if (userCorrections.length > 0) {
    // Check if the user previously corrected this exact merchant and item combination
    const itemString = items.map(i => i.name.toLowerCase()).join(" ");
    for (const corr of userCorrections) {
      const corrMerchant = (corr.merchant || "").toLowerCase();
      const corrSummary = (corr.itemSummary || "").toLowerCase();

      const merchantMatches = merchant && corrMerchant && merchant.toLowerCase().includes(corrMerchant);
      const itemsMatch = corrSummary && itemString && (itemString.includes(corrSummary) || corrSummary.includes(itemString));

      if (merchantMatches && itemsMatch && isValidCategory(corr.correctedCategory)) {
        return {
          category: normalizeCategoryName(corr.correctedCategory),
          confidence: 0.98,
          confidence_level: "high",
          reason: `Matched user correction history for ${merchant} (${corr.itemSummary} → ${corr.correctedCategory})`,
          matchedBy: "user_correction"
        };
      } else if (merchantMatches && !corrSummary && isValidCategory(corr.correctedCategory)) {
        return {
          category: normalizeCategoryName(corr.correctedCategory),
          confidence: 0.94,
          confidence_level: "high",
          reason: `Matched user correction history for merchant ${merchant}`,
          matchedBy: "user_correction"
        };
      }
    }
  }

  // =========================================================================
  // Layer 1: Dedicated Merchant Mapping (Uber, Swiggy, Netflix, Apollo, etc.)
  // If merchant is a dedicated single-category brand, map directly!
  // Multi-category retailers (Amazon, Flipkart) are skipped here.
  // =========================================================================
  const merchantMatch = matchMerchantRule(merchant);
  if (merchantMatch && !isMultiCategoryMerchant(merchant)) {
    return {
      category: merchantMatch.category,
      confidence: merchantMatch.confidence,
      confidence_level: merchantMatch.confidence >= 0.90 ? "high" : "medium",
      reason: `Known merchant profile: ${merchant} maps directly to ${merchantMatch.category}`,
      matchedBy: "merchant_rule"
    };
  }

  // =========================================================================
  // Layer 2: Item Keyword Matching (Item-Level Classification)
  // CRITICAL RULE (Section 4): "Do not classify using only the merchant name."
  // Amazon + Nike shoes -> Clothing
  // Amazon + Logitech keyboard -> Electronics
  // Amazon + Grocery items -> Groceries
  // =========================================================================
  const itemMatch = matchItemKeywords(items, billText);
  const isMultiMerchant = isMultiCategoryMerchant(merchant);

  if (itemMatch && itemMatch.score >= 1.0) {
    // Strong item keyword hit
    const confidence = Math.min(0.97, 0.88 + itemMatch.score * 0.03);
    const confidenceLevel = confidence >= 0.90 ? "high" : "medium";

    return {
      category: itemMatch.category,
      confidence: Number(confidence.toFixed(2)),
      confidence_level: confidenceLevel,
      reason: `Identified by item keywords: ${itemMatch.matchedKeywords.slice(0, 3).join(", ")}${merchant ? ` on ${merchant}` : ""}`,
      matchedBy: "item_keywords"
    };
  }

  // If merchant is multi-category (like Amazon) but item match had low score:
  if (isMultiMerchant && itemMatch && itemMatch.score > 0) {
    const confidence = 0.78;
    return {
      category: itemMatch.category,
      confidence,
      confidence_level: "medium",
      reason: `Partial match on item keywords: ${itemMatch.matchedKeywords.join(", ")} from ${merchant}`,
      matchedBy: "item_keywords"
    };
  }

  // If it's a multi-category merchant and NO item match could be found,
  // classify as Shopping with medium/low confidence
  if (isMultiMerchant && (!itemMatch || itemMatch.score === 0)) {
    return {
      category: "Shopping",
      confidence: 0.65,
      confidence_level: "low",
      reason: `${merchant} sells across multiple categories and item details were unspecific. Suggested Shopping.`,
      matchedBy: "merchant_rule"
    };
  }

  // If item match had lower score for non-multi-category merchant:
  if (itemMatch && itemMatch.score > 0) {
    const confidence = Math.min(0.85, 0.70 + itemMatch.score * 0.05);
    return {
      category: itemMatch.category,
      confidence: Number(confidence.toFixed(2)),
      confidence_level: confidence >= 0.90 ? "high" : "medium",
      reason: `Suggested based on keyword context: ${itemMatch.matchedKeywords.join(", ")}`,
      matchedBy: "item_keywords"
    };
  }

  // =========================================================================
  // Layer 3: AI / Contextual Analysis Fallback
  // =========================================================================
  const textSample = (merchant + " " + billText).toLowerCase();

  if (/\b(pharmacy|chemist|clinic|hospital|doctor|medic|rx|dr\.)\b/.test(textSample)) {
    return {
      category: "Healthcare",
      confidence: 0.85,
      confidence_level: "medium",
      reason: "Medical terms detected in document header",
      matchedBy: "ai_fallback"
    };
  }

  if (/\b(restaurant|cafe|dhaba|dining|kitchen|bakery|food|bar|pub|sweets)\b/.test(textSample)) {
    return {
      category: "Food",
      confidence: 0.82,
      confidence_level: "medium",
      reason: "Dining / restaurant terms identified in bill context",
      matchedBy: "ai_fallback"
    };
  }

  if (/\b(supermarket|provisions|kirana|grocer|daily\s*needs|bazaar)\b/.test(textSample)) {
    return {
      category: "Groceries",
      confidence: 0.82,
      confidence_level: "medium",
      reason: "Supermarket / grocery store terms detected in bill context",
      matchedBy: "ai_fallback"
    };
  }

  if (/\b(electricity|water\s*board|electricity\s*board|piped\s*gas|broadband\s*bill|broadband|telecom\s*bill|utility\s*bill)\b/.test(textSample)) {
    return {
      category: "Bills & Utilities",
      confidence: 0.85,
      confidence_level: "medium",
      reason: "Utility provider terminology detected",
      matchedBy: "ai_fallback"
    };
  }

  // =========================================================================
  // Default Fallback: Low confidence manual review required
  // =========================================================================
  return {
    category: "Other",
    confidence: 0.50,
    confidence_level: "low",
    reason: "No unambiguous merchant or line item match found. Review required.",
    matchedBy: "default"
  };
}
