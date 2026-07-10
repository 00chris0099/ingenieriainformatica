/**
 * Siigo API Client for Accounting Integration
 * Handles invoice sync, client sync, and product catalog sync
 * API Documentation: https://api-siigo.readme.io/
 */

export interface SiigoConfig {
  baseUrl: string;
  apiKey: string;
  username: string;
  accessKey: string;
  sellerId: number;
  defaultWarehouseId: number;
}

export interface SiigoInvoice {
  document: {
    code: number; // 9993 for Factura, 9995 for Boleta
  };
  date: string;
  customer: {
    identification: string;
    check_digit: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
  }>;
  payments: Array<{
    id: number; // 1291 for Efectivo, 1292 for Tarjeta, etc.
    amount: number;
  }>;
  seller?: number;
  warehouse?: number;
  observations?: string;
}

export interface SiigoProduct {
  code: string;
  name: string;
  description?: string;
  type: string; // 'Product' or 'Service'
  category?: string;
  unit: string; // 'UND', 'PZA', etc.
  price: number;
  tax?: number;
  stock?: number;
}

export interface SiigoCustomer {
  identification_type: string; // 'CC', 'NIT', 'CE', etc.
  identification: string;
  check_digit?: string;
  name: string;
  trade_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export class SiigoClient {
  private config: SiigoConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config?: Partial<SiigoConfig>) {
    this.config = {
      baseUrl: process.env.SIIGO_API_URL || 'https://api.sigo.com.co/v1',
      apiKey: process.env.SIIGO_API_KEY || '',
      username: process.env.SIIGO_USERNAME || '',
      accessKey: process.env.SIIGO_ACCESS_KEY || '',
      sellerId: parseInt(process.env.SIIGO_SELLER_ID || '0'),
      defaultWarehouseId: parseInt(process.env.SIIGO_WAREHOUSE_ID || '0'),
      ...config,
    };
  }

  /**
   * Authenticate with Siigo API
   */
  async authenticate(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          access_key: this.config.accessKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Siigo authentication error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  private async request(method: string, path: string, body?: any): Promise<any> {
    const token = await this.authenticate();
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Integration': 'AdriSuKids-WMS',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Siigo API error: ${response.status} - ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  // ============================================================================
  // INVOICES
  // ============================================================================

  /**
   * Create an invoice in Siigo
   */
  async createInvoice(invoice: SiigoInvoice): Promise<any> {
    return this.request('POST', '/invoices', invoice);
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<any> {
    return this.request('GET', `/invoices/${id}`);
  }

  /**
   * List invoices with filters
   */
  async listInvoices(params?: {
    date_start?: string;
    date_end?: string;
    customer?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.date_start) query.set('date_start', params.date_start);
    if (params?.date_end) query.set('date_end', params.date_end);
    if (params?.customer) query.set('customer', params.customer);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return this.request('GET', `/invoices?${query.toString()}`);
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(id: string, reason: string): Promise<any> {
    return this.request('PUT', `/invoices/${id}/cancel`, { reason });
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Create a product in Siigo
   */
  async createProduct(product: SiigoProduct): Promise<any> {
    return this.request('POST', '/products', product);
  }

  /**
   * Update a product in Siigo
   */
  async updateProduct(code: string, product: Partial<SiigoProduct>): Promise<any> {
    return this.request('PUT', `/products/${code}`, product);
  }

  /**
   * Get product by code
   */
  async getProduct(code: string): Promise<any> {
    return this.request('GET', `/products/${code}`);
  }

  /**
   * List products
   */
  async listProducts(params?: {
    code?: string;
    name?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.code) query.set('code', params.code);
    if (params?.name) query.set('name', params.name);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return this.request('GET', `/products?${query.toString()}`);
  }

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  /**
   * Create a customer in Siigo
   */
  async createCustomer(customer: SiigoCustomer): Promise<any> {
    return this.request('POST', '/customers', customer);
  }

  /**
   * Update a customer in Siigo
   */
  async updateCustomer(id: string, customer: Partial<SiigoCustomer>): Promise<any> {
    return this.request('PUT', `/customers/${id}`, customer);
  }

  /**
   * Get customer by identification
   */
  async getCustomer(identification: string): Promise<any> {
    return this.request('GET', `/customers/${identification}`);
  }

  /**
   * List customers
   */
  async listCustomers(params?: {
    identification?: string;
    name?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.identification) query.set('identification', params.identification);
    if (params?.name) query.set('name', params.name);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return this.request('GET', `/customers?${query.toString()}`);
  }

  // ============================================================================
  // ACCOUNTS (Chart of Accounts)
  // ============================================================================

  /**
   * List accounts (Chart of Accounts)
   */
  async listAccounts(params?: {
    code?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.code) query.set('code', params.code);
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return this.request('GET', `/accounts?${query.toString()}`);
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  /**
   * List payment types
   */
  async listPaymentTypes(): Promise<any> {
    return this.request('GET', '/payment-types');
  }

  /**
   * Create a payment
   */
  async createPayment(payment: {
    invoice_id: string;
    date: string;
    account_id: number;
    amount: number;
    notes?: string;
  }): Promise<any> {
    return this.request('POST', '/payments', payment);
  }

  // ============================================================================
  // CONTACTS (Suppliers)
  // ============================================================================

  /**
   * Create a contact (supplier)
   */
  async createContact(contact: {
    identification_type: string;
    identification: string;
    name: string;
    type: string; // 'Provider'
    address?: string;
    phone?: string;
    email?: string;
  }): Promise<any> {
    return this.request('POST', '/contacts', contact);
  }

  /**
   * List contacts
   */
  async listContacts(params?: {
    type?: string;
    name?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.name) query.set('name', params.name);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    
    return this.request('GET', `/contacts?${query.toString()}`);
  }
}

// Singleton instance
export const siigo = new SiigoClient();
