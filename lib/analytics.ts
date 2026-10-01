// Lightweight, privacy-first analytics helper

export type AnalyticsEvent = 
  | "page_view"
  | "user_signup"
  | "user_login"
  | "expense_added"
  | "expense_deleted"
  | "emi_added"
  | "goal_updated"
  | "badge_unlocked"
  | "profile_updated"
  | "bill_uploaded"
  | "bill_uploaded_expense_created"
  | "statement_uploaded"
  | "statement_imported";

interface EventPayload {
  category?: string;
  value?: number;
  label?: string;
  [key: string]: any;
}

export function trackEvent(eventName: AnalyticsEvent, payload: EventPayload = {}) {
  try {
    if (typeof window === "undefined") return;

    // Check cookie consent
    const consentStr = localStorage.getItem("spendwise_cookie_consent");
    const consent = consentStr ? JSON.parse(consentStr) : null;
    
    // Log privacy-safe event in non-PII format
    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      ...payload
    };

    // Store recent activity log locally for dashboard insights
    const existingStr = localStorage.getItem("spendwise_event_log");
    const existing = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(eventData);
    if (existing.length > 50) existing.pop();
    localStorage.setItem("spendwise_event_log", JSON.stringify(existing));

    // Optional Cloudflare / Web Analytics dispatch hook
    if ((window as any).sa_event) {
      (window as any).sa_event(eventName, payload);
    }
  } catch (e) {
    // Fail silently
  }
}
