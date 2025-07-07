import { 
  User, 
  Product, 
  Category, 
  Location, 
  Inventory, 
  IncomingOrder, 
  IncomingOrderItem,
  OutgoingOrder,
  OutgoingOrderItem,
  InventoryMovement 
} from "@shared/schema";

// Re-export all shared types
export type {
  User,
  Product,
  Category,
  Location,
  Inventory,
  IncomingOrder,
  IncomingOrderItem,
  OutgoingOrder,
  OutgoingOrderItem,
  InventoryMovement
};

// Extended types for frontend use
export interface EnrichedInventory extends Inventory {
  product?: Product;
  location?: Location;
}

export interface EnrichedIncomingOrder extends IncomingOrder {
  items?: IncomingOrderItem[];
}

export interface EnrichedOutgoingOrder extends OutgoingOrder {
  items?: OutgoingOrderItem[];
}

export interface DashboardData {
  totalProducts: number;
  lowStock: number;
  todayIncoming: number;
  pendingOutgoing: number;
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  description: string;
  reference?: string;
  user: string;
  timestamp: string;
  status: string;
}

// UI State types
export interface TableState {
  searchTerm: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
}

export interface FilterState {
  category?: string;
  status?: string;
  location?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Form types
export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  unitPrice?: string;
  minStock?: number;
  maxStock?: number;
}

export interface OrderFormData {
  orderNumber: string;
  supplierName?: string;
  customerName?: string;
  status: string;
  priority?: string;
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  productId: number;
  quantity: number;
  unitPrice?: string;
  locationId?: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

// Status types
export type InventoryStatus = 'low' | 'medium' | 'ok' | 'overstocked';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
