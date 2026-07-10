/**
 * ZPL (Zebra Programming Language) Label Generator
 * Generates ZPL code for printing labels on thermal printers
 */

export interface LabelConfig {
  width: number; // in dots (203 dpi: 1mm = 8 dots)
  height: number;
  printerDpi: number;
}

export interface ProductLabelData {
  sku: string;
  name: string;
  price: string;
  barcode?: string;
  imageUrl?: string;
}

export interface ShippingLabelData {
  orderNumber: string;
  customerName: string;
  address: string;
  city: string;
  phone?: string;
  trackingNumber?: string;
  carrier: string;
  weight?: string;
}

// Default label configs (in dots at 203 dpi)
export const LABEL_CONFIGS = {
  // 50mm x 30mm product label
  product_small: { width: 400, height: 240, printerDpi: 203 },
  // 100mm x 50mm product label
  product_large: { width: 800, height: 400, printerDpi: 203 },
  // 100mm x 100mm shipping label
  shipping: { width: 800, height: 800, printerDpi: 203 },
  // 100mm x 150mm shipping label (large)
  shipping_large: { width: 800, height: 1200, printerDpi: 203 },
};

/**
 * Generate ZPL for a product label (small - 50x30mm)
 */
export function generateProductLabel(data: ProductLabelData, config = LABEL_CONFIGS.product_small): string {
  const { sku, name, price, barcode } = data;
  
  // Truncate name if too long
  const displayName = name.length > 25 ? name.substring(0, 22) + '...' : name;

  return `
^XA

^POI
^PW${config.width}
^PQ1,0,1

; Border
^LS0
^LH0,0
^LRN
^XZ

; SKU
^FO20,20
^A0N,20,20
^FD${sku}
^FS

; Product Name
^FO20,50
^A0N,24,24
^FD${displayName}
^FS

; Price
^FO20,90
^A0N,28,28
^FD${price}
^FS

; Barcode
${barcode ? `^FO20,140
^BY2
^BCN,80,Y,N,N
^FD${barcode}
^FS` : ''}

^XZ`.trim();
}

/**
 * Generate ZPL for a product label (large - 100x50mm)
 */
export function generateProductLabelLarge(data: ProductLabelData): string {
  const { sku, name, price, barcode } = data;
  
  const displayName = name.length > 40 ? name.substring(0, 37) + '...' : name;

  return `
^XA

^POI
^PW800
^PQ1,0,1

; SKU
^FO30,30
^A0N,28,28
^FD${sku}
^FS

; Product Name (large)
^FO30,70
^A0N,36,36
^FD${displayName}
^FS

; Price (large)
^FO30,130
^A0N,48,48
^FD${price}
^FS

; Barcode
${barcode ? `^FO30,200
^BY3
^BCN,120,Y,N,N
^FD${barcode}
^FS` : ''}

^XZ`.trim();
}

/**
 * Generate ZPL for a shipping label (100x100mm)
 */
export function generateShippingLabel(data: ShippingLabelData): string {
  const { orderNumber, customerName, address, city, phone, trackingNumber, carrier, weight } = data;

  // Truncate long text
  const displayAddress = address.length > 35 ? address.substring(0, 32) + '...' : address;
  const displayName = customerName.length > 30 ? customerName.substring(0, 27) + '...' : customerName;

  return `
^XA

^POI
^PW800
^PQ1,0,1

; Header - Carrier
^FO30,30
^A0N,32,32
^FD${carrier}
^FS

; Order Number
^FO30,80
^A0N,24,24
^FDPedido: ${orderNumber}
^FS

; Separator line
^FO30,120
^GB740,2,2^FS

; Customer Name
^FO30,140
^A0N,28,28
^FDPara: ${displayName}
^FS

; Address
^FO30,180
^A0N,24,24
^FD${displayAddress}
^FS

; City
^FO30,220
^A0N,24,24
^FD${city}
^FS

; Phone
${phone ? `^FO30,260
^A0N,20,20
^FDTel: ${phone}
^FS` : ''}

; Tracking Number
${trackingNumber ? `^FO30,310
^BY2
^BCN,80,Y,N,N
^FD${trackingNumber}
^FS

^FO30,410
^A0N,20,20
^FDTracking: ${trackingNumber}
^FS` : ''}

; Weight
${weight ? `^FO30,${trackingNumber ? 450 : 310}
^A0N,20,20
^FDPeso: ${weight}
^FS` : ''}

; Separator before footer
^FO30,${trackingNumber ? 490 : 360}
^GB740,2,2^FS

; Footer
^FO30,${trackingNumber ? 510 : 380}
^A0N,16,16
^FDAdriSu Kids - adriskids.com
^FS

^XZ`.trim();
}

/**
 * Generate ZPL for a shipping label (large - 100x150mm)
 */
export function generateShippingLabelLarge(data: ShippingLabelData): string {
  const { orderNumber, customerName, address, city, phone, trackingNumber, carrier, weight } = data;

  return `
^XA

^POI
^PW800
^PQ1,0,1

; Header - Carrier
^FO30,30
^A0N,40,40
^FD${carrier}
^FS

; Order Number
^FO30,90
^A0N,28,28
^FDPedido: ${orderNumber}
^FS

; Separator line
^FO30,140
^GB740,3,3^FS

; Customer Name (large)
^FO30,170
^A0N,36,36
^FDPara: ${customerName}
^FS

; Address (large)
^FO30,230
^A0N,28,28
^FD${address}
^FS

; City
^FO30,280
^A0N,28,28
^FD${city}
^FS

; Phone
${phone ? `^FO30,340
^A0N,24,24
^FDTel: ${phone}
^FS` : ''}

; Tracking Number (large barcode)
${trackingNumber ? `^FO30,${phone ? 400 : 350}
^BY3
^BCN,120,Y,N,N
^FD${trackingNumber}
^FS

^FO30,${phone ? 550 : 500}
^A0N,24,24
^FDTracking: ${trackingNumber}
^FS` : ''}

; Weight
${weight ? `^FO30,${phone ? 600 : 550}
^A0N,24,24
^FDPeso: ${weight}
^FS` : ''}

; Separator before footer
^FO30,${phone ? 650 : 600}
^GB740,3,3^FS

; Footer
^FO30,${phone ? 680 : 630}
^A0N,20,20
^FDAdriSu Kids - adriskids.com
^FS

^XZ`.trim();
}

/**
 * Convert ZPL to printable format (for web printing)
 * This creates a simple representation that can be printed via browser
 */
export function zplToPrintableHtml(zpl: string): string {
  // Simple HTML representation for preview
  // In production, use a ZPL renderer or print directly to printer
  return `
    <div style="font-family: monospace; white-space: pre-wrap; padding: 20px; border: 1px solid #ccc;">
      <pre>${zpl}</pre>
    </div>
  `;
}

/**
 * Send ZPL to printer via network (raw TCP)
 * Note: This requires a server-side implementation
 */
export async function sendZplToPrinter(
  printerIp: string,
  printerPort: number,
  zpl: string
): Promise<boolean> {
  // This would need to be implemented server-side
  // using net.Socket or a library like net-ping
  console.log(`Sending ZPL to ${printerIp}:${printerPort}`);
  console.log(zpl);
  return true;
}
