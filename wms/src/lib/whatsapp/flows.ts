/**
 * WhatsApp Business Chatbot - Flow-based system with buttons
 * No AI - uses pre-defined flows and routes
 */

export interface ChatbotFlow {
  id: string;
  name: string;
  trigger: string; // keyword that triggers this flow
  steps: ChatbotStep[];
}

export interface ChatbotStep {
  id: string;
  message: string;
  buttons?: ChatbotButton[];
  nextStep?: string; // default next step if no button matched
  action?: ChatbotAction;
}

export interface ChatbotButton {
  id: string;
  text: string;
  nextStep: string;
  action?: ChatbotAction;
}

export interface ChatbotAction {
  type: 'lookup_order' | 'send_catalog' | 'create_ticket' | 'send_location' | 'escalate';
  params?: Record<string, any>;
}

export interface WhatsAppMessage {
  from: string;
  to: string;
  type: 'text' | 'button' | 'interactive' | 'image';
  text?: string;
  button?: { id: string; text: string };
  interactive?: { id: string; title: string };
}

export interface ConversationState {
  phone: string;
  currentFlow: string | null;
  currentStep: string | null;
  context: Record<string, any>;
  lastInteraction: Date;
}

// Pre-defined flows for AdriSu Kids
export const defaultFlows: ChatbotFlow[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    trigger: 'hola',
    steps: [
      {
        id: 'welcome_main',
        message: 'Hola! Bienvenido a AdriSu Kids. Como puedo ayudarte?',
        buttons: [
          { id: 'order_status', text: '📦 Estado de mi pedido', nextStep: 'order_ask_number' },
          { id: 'catalog', text: '🛒 Ver catalogo', nextStep: 'show_catalog' },
          { id: 'returns', text: '🔄 Devoluciones', nextStep: 'returns_menu' },
          { id: 'support', text: '💬 Soporte', nextStep: 'support_menu' },
        ],
      },
    ],
  },
  {
    id: 'order_status',
    name: 'Estado de Pedido',
    trigger: 'pedido',
    steps: [
      {
        id: 'order_ask_number',
        message: 'Por favor, ingresa el numero de tu pedido (ej: ORD-00001):',
        nextStep: 'order_lookup',
      },
      {
        id: 'order_lookup',
        message: '',
        action: { type: 'lookup_order' },
        nextStep: 'order_show_status',
      },
      {
        id: 'order_show_status',
        message: '',
        buttons: [
          { id: 'order_more', text: 'Ver otro pedido', nextStep: 'order_ask_number' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
    ],
  },
  {
    id: 'catalog',
    name: 'Catalogo',
    trigger: 'catalogo',
    steps: [
      {
        id: 'show_catalog',
        message: 'Nuestro catalogo de muebles para bebes:',
        buttons: [
          { id: 'cat_camas', text: '🛏️ Camas y Cunas', nextStep: 'cat_camas_detail' },
          { id: 'cat_sillas', text: '🪑 Sillas Altas', nextStep: 'cat_sillas_detail' },
          { id: 'cat_carritos', text: '👶 Carritos', nextStep: 'cat_carritos_detail' },
          { id: 'cat_decor', text: '🎨 Decoracion', nextStep: 'cat_decor_detail' },
        ],
        action: { type: 'send_catalog' },
      },
      {
        id: 'cat_camas_detail',
        message: 'Visita nuestra tienda para ver todos los productos disponibles en esta categoria.',
        buttons: [
          { id: 'back_catalog', text: 'Volver al catalogo', nextStep: 'show_catalog' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'cat_sillas_detail',
        message: 'Visita nuestra tienda para ver todos los productos disponibles en esta categoria.',
        buttons: [
          { id: 'back_catalog', text: 'Volver al catalogo', nextStep: 'show_catalog' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'cat_carritos_detail',
        message: 'Visita nuestra tienda para ver todos los productos disponibles en esta categoria.',
        buttons: [
          { id: 'back_catalog', text: 'Volver al catalogo', nextStep: 'show_catalog' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'cat_decor_detail',
        message: 'Visita nuestra tienda para ver todos los productos disponibles en esta categoria.',
        buttons: [
          { id: 'back_catalog', text: 'Volver al catalogo', nextStep: 'show_catalog' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
    ],
  },
  {
    id: 'returns',
    name: 'Devoluciones',
    trigger: 'devolucion',
    steps: [
      {
        id: 'returns_menu',
        message: 'Politica de devoluciones:\n\n✅ 7 dias para devoluciones\n✅ Producto en empaque original\n✅ Sin uso ni danos\n\nComo proceder?',
        buttons: [
          { id: 'return_start', text: 'Iniciar devolucion', nextStep: 'return_ask_order' },
          { id: 'return_status', text: 'Estado de devolucion', nextStep: 'return_ask_rma' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'return_ask_order',
        message: 'Ingresa tu numero de pedido para iniciar la devolucion:',
        nextStep: 'return_process',
      },
      {
        id: 'return_process',
        message: 'Hemos registrado tu solicitud de devolucion. Nuestro equipo te contactara en 24 horas.',
        action: { type: 'create_ticket', params: { type: 'return' } },
        nextStep: 'return_confirm',
      },
      {
        id: 'return_confirm',
        message: 'Gracias! Algo mas en lo que pueda ayudarte?',
        buttons: [
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
    ],
  },
  {
    id: 'support',
    name: 'Soporte',
    trigger: 'soporte',
    steps: [
      {
        id: 'support_menu',
        message: 'Centro de soporte. Selecciona una opcion:',
        buttons: [
          { id: 'support_faq', text: '❓ Preguntas frecuentes', nextStep: 'support_faq' },
          { id: 'support_chat', text: '💬 Hablar con asesor', nextStep: 'support_escalate' },
          { id: 'support_location', text: '📍 Nuestra ubicacion', nextStep: 'support_location' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'support_faq',
        message: 'Preguntas frecuentes:\n\n1. Horario: Lun-Sab 9am-6pm\n2. Envios: 1-3 dias habiles\n3. Pagos: Yape, Plin, Tarjetas\n4. Garantia: 1 año en productos',
        buttons: [
          { id: 'support_chat', text: 'Hablar con asesor', nextStep: 'support_escalate' },
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
      {
        id: 'support_escalate',
        message: 'Un asesor estara contigo en breve. Tiempo estimado: 5-10 minutos.',
        action: { type: 'escalate' },
        nextStep: 'support_wait',
      },
      {
        id: 'support_wait',
        message: 'Mientras esperas, puedes revisar nuestro catalogo.',
        buttons: [
          { id: 'catalog', text: 'Ver catalogo', nextStep: 'show_catalog' },
        ],
      },
      {
        id: 'support_location',
        message: '📍 AdriSu Kids\nAv. Principal 123, Lima\n\nHorario: Lun-Sab 9am-6pm\nTel: +51 999 888 777',
        action: { type: 'send_location', params: { lat: -12.0464, lng: -77.0428 } },
        buttons: [
          { id: 'back_main', text: 'Volver al inicio', nextStep: 'welcome_main' },
        ],
      },
    ],
  },
];
