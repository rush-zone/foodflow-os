export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  available: boolean;
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
