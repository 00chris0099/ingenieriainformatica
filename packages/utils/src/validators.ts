import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug requerido'),
});

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Nombre requerido').max(100),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ============================================================================
// Product Schemas
// ============================================================================

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU requerido').max(50),
  name: z.string().min(1, 'Nombre requerido').max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  brand: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']).default('draft'),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  price: z.number().min(0).default(0),
  compareAtPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  barcode: z.string().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.string().default('kg'),
  metadata: z.record(z.any()).default({}),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Category Schemas
// ============================================================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================================================
// Order Schemas
// ============================================================================

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Cliente requerido'),
  currency: z.string().default('PEN'),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  source: z.enum(['web', 'pos', 'phone', 'whatsapp']).default('web'),
  billingAddress: z.record(z.any()).default({}),
  shippingAddress: z.record(z.any()).default({}),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
    discountPercent: z.number().min(0).max(100).default(0),
  })).min(1, 'Al menos un item requerido'),
  metadata: z.record(z.any()).default({}),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'draft', 'pending', 'confirmed', 'processing', 'picking', 'packing',
    'ready_to_ship', 'shipped', 'in_transit', 'delivered',
    'cancelled', 'returned', 'refunded',
  ]),
  reason: z.string().max(500).optional(),
  changedByType: z.enum(['user', 'agent', 'system', 'webhook']).default('user'),
});

export const orderFilterSchema = paginationSchema.extend({
  status: z.enum([
    'draft', 'pending', 'confirmed', 'processing', 'picking', 'packing',
    'ready_to_ship', 'shipped', 'in_transit', 'delivered',
    'cancelled', 'returned', 'refunded',
  ]).optional(),
  paymentStatus: z.enum([
    'pending', 'authorized', 'captured', 'partially_paid', 'paid',
    'failed', 'refunded', 'voided',
  ]).optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  source: z.enum(['web', 'pos', 'phone', 'whatsapp']).optional(),
});

// ============================================================================
// Customer Schemas
// ============================================================================

export const createCustomerSchema = z.object({
  customerType: z.enum(['individual', 'business', 'importer']).default('individual'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  fullName: z.string().min(1, 'Nombre requerido').max(200),
  companyName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  billingAddress: z.record(z.any()).default({}),
  shippingAddress: z.record(z.any()).default({}),
  priceListId: z.string().uuid().optional().nullable(),
  creditLimit: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerFilterSchema = paginationSchema.extend({
  customerType: z.enum(['individual', 'business', 'importer']).optional(),
  isActive: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Inventory Schemas (Simplified - stock on Product directly)
// ============================================================================

export const updateStockSchema = z.object({
  productId: z.string().uuid(),
  stock: z.number().int().min(0),
});

// ============================================================================
// Invoice Schemas
// ============================================================================

export const createInvoiceSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid('Cliente requerido'),
  currency: z.string().default('PEN'),
  taxAmount: z.number().min(0).default(0),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional(),
  items: z.array(z.object({
    orderItemId: z.string().uuid().optional().nullable(),
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
  })).min(1, 'Al menos un item requerido'),
  metadata: z.record(z.any()).default({}),
});

// ============================================================================
// Supplier Schemas
// ============================================================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  code: z.string().min(1, 'Codigo requerido').max(20),
  supplierType: z.enum(['local', 'international']).default('local'),
  contactName: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.record(z.any()).default({}),
  country: z.string().max(100).optional().nullable(),
  currency: z.string().default('PEN'),
  paymentTerms: z.string().max(100).optional().nullable(),
  leadTimeDays: z.number().int().min(0).default(7),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================================================
// Warehouse Schemas
// ============================================================================

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  code: z.string().min(1, 'Codigo requerido').max(20),
  description: z.string().max(500).optional().nullable(),
  address: z.record(z.any()).default({}),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

// ============================================================================
// Purchase Order Schemas
// ============================================================================

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Proveedor requerido'),
  warehouseId: z.string().uuid('Almacen requerido'),
  currency: z.string().default('PEN'),
  expectedDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
  })).min(1, 'Al menos un item requerido'),
  metadata: z.record(z.any()).default({}),
});

// ============================================================================
// Shipment Schemas
// ============================================================================

export const createShipmentSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid('Almacen requerido'),
  carrier: z.string().min(1, 'Transportista requerido').max(100),
  trackingNumber: z.string().max(100).optional().nullable(),
  shippingAddress: z.record(z.any()).default({}),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.record(z.any()).default({}),
  cost: z.number().min(0).optional().nullable(),
  estimatedDelivery: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.any()).default({}),
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Mensaje requerido').max(2000),
  sessionId: z.string().uuid().optional(),
});

// ============================================================================
// Webhook Schemas
// ============================================================================

export const webhookPaymentSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
});

// ============================================================================
// Notification Schemas
// ============================================================================

export const createNotificationSchema = z.object({
  notificationType: z.enum(['email', 'push', 'sms', 'webhook', 'in_app']),
  recipientId: z.string().uuid().optional().nullable(),
  recipientEmail: z.string().email().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, 'Contenido requerido'),
  htmlBody: z.string().optional(),
  templateName: z.string().max(100).optional(),
  templateVars: z.record(z.any()).default({}),
  channel: z.string().optional(),
  priority: z.number().int().min(0).max(10).default(0),
  metadata: z.record(z.any()).default({}),
});

// ============================================================================
// User Management Schemas
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email('Email invalido'),
  fullName: z.string().min(2, 'Nombre requerido').max(100),
  phone: z.string().optional().nullable(),
  role: z.enum([
    'super_admin', 'admin', 'warehouse_manager', 'warehouse_staff',
    'sales_manager', 'sales_rep', 'logistics_coordinator',
    'customer_service', 'finance', 'readonly',
  ]).default('readonly'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial();

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});
