export interface StockLink {
  stockId: string; // id do StockItem
  qty: number;     // quantidade consumida por unidade vendida
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;        // 0 = grátis
  stockLinks?: StockLink[]; // insumos consumidos por unidade deste extra
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  available: boolean;
  stockLinks?: StockLink[];  // insumos consumidos ao vender
  extras?: ProductExtra[];   // adicionais/ingredientes opcionais
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type PaymentMethod = "cash" | "card" | "pix";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered";

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  discount: number;
  createdAt: Date;
}
