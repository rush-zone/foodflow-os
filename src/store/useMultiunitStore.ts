import { create } from "zustand";

export type UnitStatus = "open" | "busy" | "closed" | "alert";

export interface UnitAlert {
  id: string;
  type: "stock" | "delivery" | "kds" | "system";
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: Date;
}

export interface UnitStaff {
  name: string;
  role: string;
  avatar: string;
  clockedIn: boolean;
}

export interface UnitHourlyData {
  hour: string;
  orders: number;
  revenue: number;
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  manager: string;
  status: UnitStatus;
  openAt: string;
  closeAt: string;

  // Today's metrics
  todayRevenue: number;
  todayOrders: number;
  todayAvgTicket: number;
  todayDeliveries: number;
  activeOrders: number;
  pendingKDS: number;

  // Week comparison
  weekRevenue: number;
  weekRevenueLastWeek: number;

  // Staff on duty
  staff: UnitStaff[];

  // Alerts
  alerts: UnitAlert[];

  // Hourly data
  hourly: UnitHourlyData[];
}

const now = Date.now();
const d = (m: number) => new Date(now - m * 60000);

const units: Unit[] = [
  {
    id: "u1",
    name: "Vila Madalena",
    address: "Rua Aspicuelta, 456",
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    phone: "(11) 3333-1111",
    manager: "Felipe Souza",
    status: "open",
    openAt: "11:00",
    closeAt: "23:00",
    todayRevenue: 3842.6,
    todayOrders: 54,
    todayAvgTicket: 71.2,
    todayDeliveries: 31,
    activeOrders: 8,
    pendingKDS: 3,
    weekRevenue: 24180.0,
    weekRevenueLastWeek: 21400.0,
    staff: [
      { name: "Felipe Souza",  role: "Gerente",   avatar: "FS", clockedIn: true },
      { name: "Maria Lima",    role: "Caixa",     avatar: "ML", clockedIn: true },
      { name: "João Pedro",    role: "Cozinheiro",avatar: "JP", clockedIn: true },
      { name: "Carlos Mendes", role: "Atendente", avatar: "CM", clockedIn: true },
      { name: "Rafael Costa",  role: "Motoboy",   avatar: "RC", clockedIn: false },
    ],
    alerts: [
      { id: "a1", type: "stock",    message: "Cheddar Fatiado abaixo do mínimo (2kg restantes)",    severity: "warning",  timestamp: d(45) },
      { id: "a2", type: "kds",      message: "Pedido #38 aguarda preparo há 12 minutos",             severity: "warning",  timestamp: d(12) },
    ],
    hourly: [
      { hour: "11h", orders: 4,  revenue: 280 },
      { hour: "12h", orders: 9,  revenue: 640 },
      { hour: "13h", orders: 12, revenue: 854 },
      { hour: "14h", orders: 7,  revenue: 498 },
      { hour: "15h", orders: 3,  revenue: 214 },
      { hour: "16h", orders: 2,  revenue: 143 },
      { hour: "17h", orders: 4,  revenue: 285 },
      { hour: "18h", orders: 7,  revenue: 498 },
      { hour: "19h", orders: 6,  revenue: 428 },
    ],
  },
  {
    id: "u2",
    name: "Pinheiros",
    address: "Rua dos Pinheiros, 1200",
    neighborhood: "Pinheiros",
    city: "São Paulo",
    phone: "(11) 3333-2222",
    manager: "Camila Rocha",
    status: "busy",
    openAt: "11:00",
    closeAt: "23:30",
    todayRevenue: 5210.4,
    todayOrders: 72,
    todayAvgTicket: 72.4,
    todayDeliveries: 44,
    activeOrders: 14,
    pendingKDS: 7,
    weekRevenue: 31840.0,
    weekRevenueLastWeek: 29100.0,
    staff: [
      { name: "Camila Rocha",  role: "Gerente",   avatar: "CR", clockedIn: true },
      { name: "Bruno Alves",   role: "Cozinheiro",avatar: "BA", clockedIn: true },
      { name: "Luana Silva",   role: "Cozinheiro",avatar: "LS", clockedIn: true },
      { name: "Diego Martins", role: "Caixa",     avatar: "DM", clockedIn: true },
      { name: "Thiago Lima",   role: "Motoboy",   avatar: "TL", clockedIn: true },
      { name: "Aline Costa",   role: "Motoboy",   avatar: "AC", clockedIn: true },
    ],
    alerts: [
      { id: "a3", type: "delivery", message: "3 pedidos a caminho com atraso > 45 min",             severity: "critical", timestamp: d(8) },
      { id: "a4", type: "kds",      message: "Fila KDS acima de 6 pedidos — considere reforço",     severity: "warning",  timestamp: d(5) },
      { id: "a5", type: "stock",    message: "Batata Frita G: estoque para ~1h de operação",         severity: "critical", timestamp: d(20) },
    ],
    hourly: [
      { hour: "11h", orders: 6,  revenue: 434 },
      { hour: "12h", orders: 14, revenue: 1013 },
      { hour: "13h", orders: 18, revenue: 1303 },
      { hour: "14h", orders: 11, revenue: 796 },
      { hour: "15h", orders: 5,  revenue: 362 },
      { hour: "16h", orders: 3,  revenue: 217 },
      { hour: "17h", orders: 6,  revenue: 434 },
      { hour: "18h", orders: 9,  revenue: 651 },
    ],
  },
  {
    id: "u3",
    name: "Moema",
    address: "Av. Ibirapuera, 3103",
    neighborhood: "Moema",
    city: "São Paulo",
    phone: "(11) 3333-3333",
    manager: "Ricardo Fernandes",
    status: "open",
    openAt: "12:00",
    closeAt: "22:30",
    todayRevenue: 2180.0,
    todayOrders: 31,
    todayAvgTicket: 70.3,
    todayDeliveries: 18,
    activeOrders: 4,
    pendingKDS: 1,
    weekRevenue: 14200.0,
    weekRevenueLastWeek: 13800.0,
    staff: [
      { name: "Ricardo Fernandes", role: "Gerente",   avatar: "RF", clockedIn: true },
      { name: "Patricia Gomes",    role: "Cozinheiro",avatar: "PG", clockedIn: true },
      { name: "André Santos",      role: "Caixa",     avatar: "AS", clockedIn: true },
      { name: "Marcos Lima",       role: "Motoboy",   avatar: "ML", clockedIn: false },
    ],
    alerts: [
      { id: "a6", type: "system", message: "Impressora offline desde 19:42 — verificar conexão", severity: "warning", timestamp: d(30) },
    ],
    hourly: [
      { hour: "12h", orders: 5,  revenue: 351 },
      { hour: "13h", orders: 8,  revenue: 562 },
      { hour: "14h", orders: 6,  revenue: 422 },
      { hour: "15h", orders: 3,  revenue: 211 },
      { hour: "16h", orders: 2,  revenue: 141 },
      { hour: "17h", orders: 4,  revenue: 281 },
      { hour: "18h", orders: 3,  revenue: 211 },
    ],
  },
  {
    id: "u4",
    name: "ABC Plaza",
    address: "Av. Industrial, 600 — Loja 42",
    neighborhood: "Centro",
    city: "Santo André",
    phone: "(11) 4444-1111",
    manager: "Fernanda Dias",
    status: "closed",
    openAt: "11:00",
    closeAt: "22:00",
    todayRevenue: 0,
    todayOrders: 0,
    todayAvgTicket: 0,
    todayDeliveries: 0,
    activeOrders: 0,
    pendingKDS: 0,
    weekRevenue: 8940.0,
    weekRevenueLastWeek: 9200.0,
    staff: [
      { name: "Fernanda Dias", role: "Gerente",   avatar: "FD", clockedIn: false },
      { name: "Paulo Neto",    role: "Cozinheiro",avatar: "PN", clockedIn: false },
    ],
    alerts: [],
    hourly: [],
  },
];

interface MultiunitStore {
  units: Unit[];
  selectedId: string;
  select: (id: string) => void;
  dismissAlert: (unitId: string, alertId: string) => void;
}

export const useMultiunitStore = create<MultiunitStore>((set, get) => ({
  units,
  selectedId: "u1",
  select: (id) => set({ selectedId: id }),
  dismissAlert: (unitId, alertId) =>
    set({
      units: get().units.map((u) =>
        u.id === unitId
          ? { ...u, alerts: u.alerts.filter((a) => a.id !== alertId) }
          : u
      ),
    }),
}));
