// ============================================================
// WMS TypeScript Types
// Generated from Prisma schema - use these instead of `any`
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'warehouse_manager' | 'warehouse_staff' | 'sales_manager' | 'sales_rep' | 'logistics_coordinator' | 'customer_service' | 'finance' | 'readonly';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'alistado' | 'shipped' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'partially_paid' | 'paid' | 'failed' | 'refunded' | 'voided';

export type ShipmentStatus = 'pending' | 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';

export type ProductStatus = 'draft' | 'active' | 'archived' | 'discontinued';

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'voided';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'approve' | 'reject' | 'execute' | 'impersonate' | 'impersonate_end';

export type PickListStatus = 'draft' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type ReturnStatus = 'pending' | 'inspecting' | 'reconditioned' | 'damaged' | 'disposed' | 'refunded' | 'cancelled';

export type CycleCountStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// ============================================================
// Core entities
// ============================================================

export interface WmsUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  model?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  brand?: string | null;
  categoryId?: string | null;
  status: ProductStatus;
  tags: string[];
  images: string[];
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  color?: string | null;
  materials: string[];
  recommendedAge?: string | null;
  warrantyDays?: number | null;
  originCountry?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  discountPercent?: number | null;
  barcode?: string | null;
  lowStockAlert?: number | null;
  promotionBar?: PromotionBarConfig | null;
  socialProof?: SocialProofConfig | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
}

export interface PromotionBarConfig {
  enabled: boolean;
  message: string;
  hours: number;
  bgColor: string;
  textColor: string;
}

export interface SocialProofAvatar {
  id: string;
  imageUrl: string;
  name: string;
  city: string;
}

export interface SocialProofConfig {
  enabled: boolean;
  interval: number;
  messages: string[];
  avatars: SocialProofAvatar[];
}

export interface Customer {
  id: string;
  source: string;
  customerType: string;
  email?: string | null;
  phone?: string | null;
  fullName: string;
  companyName?: string | null;
  taxId?: string | null;
  billingAddress: Record<string, any>;
  shippingAddress: Record<string, any>;
  creditLimit: number;
  currentBalance: number;
  tags: string[];
  notes?: string | null;
  customerTier: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  source: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  billingAddress: Record<string, any>;
  shippingAddress: Record<string, any>;
  notes?: string | null;
  internalNotes?: string | null;
  placedAt?: string | null;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string | null;
  customerId: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  supplierType: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address: Record<string, any>;
  country?: string | null;
  currency: string;
  paymentTerms?: string | null;
  leadTimeDays: number;
  rating?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId?: string | null;
  warehouseId: string;
  carrier: string;
  trackingNumber?: string | null;
  status: ShipmentStatus;
  shippingAddress: Record<string, any>;
  weight?: number | null;
  cost?: number | null;
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  authorId?: string | null;
  publishedAt?: string | null;
  tags: string[];
  category?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API response types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StatusConfig {
  color: string;
  label: string;
}
