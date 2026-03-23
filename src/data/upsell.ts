// Affinity rules: if cart has productId X, suggest productIds Y[]
export const affinityRules: Record<string, string[]> = {
  // burgers → fries + drinks
  "1": ["8", "6", "7"],
  "2": ["8", "6", "11"],
  "3": ["8", "6", "12"],
  // pizza → drinks + dessert
  "4": ["6", "7", "10"],
  "5": ["6", "7", "10"],
  // sides → burgers
  "8": ["1", "2"],
  "9": ["2", "5"],
  "12": ["1", "3"],
  // drinks → desserts
  "6": ["10", "11"],
  "7": ["10", "11"],
  // desserts → drinks
  "10": ["6", "7"],
  "11": ["6", "7"],
};

// Category-level fallback
export const categoryAffinity: Record<string, string[]> = {
  burgers:  ["sides", "drinks"],
  pizza:    ["drinks", "desserts"],
  drinks:   ["desserts", "sides"],
  sides:    ["burgers", "drinks"],
  desserts: ["drinks"],
};

// Combos: qualify when ALL required productIds are in cart
export interface ComboDefinition {
  id: string;
  name: string;
  description: string;
  requires: string[];       // productIds that must be in cart
  discount: number;         // R$ discount applied
  emoji: string;
}

export const combos: ComboDefinition[] = [
  {
    id: "combo_classico",
    name: "Combo Clássico",
    description: "Burger + Batata + Bebida",
    requires: ["1", "8", "6"],
    discount: 6.0,
    emoji: "🍔",
  },
  {
    id: "combo_double",
    name: "Combo Double",
    description: "Double Smash + Batata G + Bebida",
    requires: ["2", "9", "6"],
    discount: 9.0,
    emoji: "🔥",
  },
  {
    id: "combo_pizza",
    name: "Combo Pizza",
    description: "Pizza + 2 Bebidas",
    requires: ["4", "6"],
    discount: 4.0,
    emoji: "🍕",
  },
  {
    id: "combo_pizza_pepperoni",
    name: "Combo Pizza Premium",
    description: "Pizza Pepperoni + Bebida + Sobremesa",
    requires: ["5", "6", "10"],
    discount: 10.0,
    emoji: "⭐",
  },
  {
    id: "combo_chicken",
    name: "Combo Chicken",
    description: "Chicken Crispy + Batata + Bebida",
    requires: ["3", "8", "6"],
    discount: 5.0,
    emoji: "🍗",
  },
  {
    id: "combo_sweet",
    name: "Combo Doce",
    description: "Brownie + Milkshake",
    requires: ["10", "11"],
    discount: 4.0,
    emoji: "🍰",
  },
];
