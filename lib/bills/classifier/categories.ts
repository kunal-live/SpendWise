export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  iconName: string;
  is_active: boolean;
}

export const SPENDWISE_CATEGORIES: CategoryDefinition[] = [
  {
    id: "food",
    name: "Food",
    description: "Dining out, cafes, fast food, and food delivery",
    color: "#f97316",
    iconName: "Utensils",
    is_active: true
  },
  {
    id: "groceries",
    name: "Groceries",
    description: "Supermarket, provisions, fresh produce, and daily essentials",
    color: "#84cc16",
    iconName: "ShoppingBag",
    is_active: true
  },
  {
    id: "shopping",
    name: "Shopping",
    description: "General retail shopping, lifestyle, and consumer goods",
    color: "#ec4899",
    iconName: "ShoppingBag",
    is_active: true
  },
  {
    id: "clothing",
    name: "Clothing",
    description: "Apparel, footwear, fashion accessories, and garments",
    color: "#a855f7",
    iconName: "Shirt",
    is_active: true
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Gadgets, computer hardware, peripherals, and electronics",
    color: "#3b82f6",
    iconName: "Laptop",
    is_active: true
  },
  {
    id: "transport",
    name: "Transport",
    description: "Fuel, public transit, cabs, taxis, tolls, and auto",
    color: "#06b6d4",
    iconName: "Car",
    is_active: true
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medicines, clinic visits, pharmacy, tests, and medical care",
    color: "#ef4444",
    iconName: "HeartPulse",
    is_active: true
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Movies, events, games, concerts, and recreational activities",
    color: "#eab308",
    iconName: "Sparkles",
    is_active: true
  },
  {
    id: "bills_utilities",
    name: "Bills & Utilities",
    description: "Electricity, water, gas, broadband, phone, and municipal bills",
    color: "#6366f1",
    iconName: "ReceiptText",
    is_active: true
  },
  {
    id: "travel",
    name: "Travel",
    description: "Flights, hotels, train tickets, lodging, and holiday trips",
    color: "#14b8a6",
    iconName: "Plane",
    is_active: true
  },
  {
    id: "education",
    name: "Education",
    description: "Courses, books, tuition fees, certifications, and school",
    color: "#8b5cf6",
    iconName: "BookOpen",
    is_active: true
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    description: "Digital subscriptions, streaming, SaaS, and memberships",
    color: "#d946ef",
    iconName: "Tv",
    is_active: true
  },
  {
    id: "other",
    name: "Other",
    description: "Miscellaneous transactions and unassigned expenses",
    color: "#71717a",
    iconName: "CircleDollarSign",
    is_active: true
  }
];

export const CATEGORY_NAMES: string[] = SPENDWISE_CATEGORIES.map(c => c.name);

export function isValidCategory(name: string): boolean {
  if (!name) return false;
  return CATEGORY_NAMES.some(c => c.toLowerCase() === name.trim().toLowerCase());
}

export function normalizeCategoryName(name: string): string {
  if (!name) return "Other";
  const found = SPENDWISE_CATEGORIES.find(c => c.name.toLowerCase() === name.trim().toLowerCase() || c.id === name.trim().toLowerCase());
  return found ? found.name : "Other";
}
