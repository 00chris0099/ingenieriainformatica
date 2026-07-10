/**
 * WhatsApp Business API Client
 * Handles sending messages and managing conversations
 */

import { ConversationState, WhatsAppMessage, defaultFlows, ChatbotFlow, ChatbotStep } from './flows';

// In-memory conversation store (use Redis in production)
const conversations = new Map<string, ConversationState>();

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = 'v18.0';
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send a button message
   */
  async sendButtonMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text },
              action: {
                buttons: buttons.map((btn) => ({
                  type: 'reply',
                  reply: { id: btn.id, title: btn.title },
                })),
              },
            },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp button message:', error);
      return false;
    }
  }

  /**
   * Send a list message
   */
  async sendListMessage(
    to: string,
    text: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
              type: 'list',
              body: { text },
              action: {
                button: buttonText,
                sections,
              },
            },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending WhatsApp list message:', error);
      return false;
    }
  }

  /**
   * Process incoming message and return response
   */
  async processMessage(from: string, message: WhatsAppMessage): Promise<void> {
    const phone = from;
    let state = conversations.get(phone);

    // Initialize conversation if new
    if (!state) {
      state = {
        phone,
        currentFlow: null,
        currentStep: null,
        context: {},
        lastInteraction: new Date(),
      };
      conversations.set(phone, state);
    }

    // Update last interaction
    state.lastInteraction = new Date();

    // Process based on current state
    if (!state.currentFlow) {
      // Look for trigger keyword
      const text = message.text?.toLowerCase() || '';
      const flow = this.findFlowByTrigger(text);

      if (flow) {
        state.currentFlow = flow.id;
        state.currentStep = flow.steps[0].id;
        await this.executeStep(phone, state, flow);
      } else {
        // Default welcome
        state.currentFlow = 'welcome';
        state.currentStep = 'welcome_main';
        const welcomeFlow = defaultFlows.find((f) => f.id === 'welcome');
        if (welcomeFlow) {
          await this.executeStep(phone, state, welcomeFlow);
        }
      }
    } else {
      // Continue existing flow
      const flow = defaultFlows.find((f) => f.id === state!.currentFlow);
      if (flow) {
        await this.handleStepResponse(phone, state, flow, message);
      }
    }
  }

  /**
   * Find flow by trigger keyword
   */
  private findFlowByTrigger(text: string): ChatbotFlow | null {
    for (const flow of defaultFlows) {
      if (text.includes(flow.trigger)) {
        return flow;
      }
    }
    return null;
  }

  /**
   * Execute a chatbot step
   */
  private async executeStep(phone: string, state: ConversationState, flow: ChatbotFlow): Promise<void> {
    const step = flow.steps.find((s) => s.id === state.currentStep);
    if (!step) return;

    // Execute action if present
    if (step.action) {
      await this.executeAction(phone, step.action, state);
    }

    // Send message with or without buttons
    if (step.buttons && step.buttons.length > 0) {
      await this.sendButtonMessage(
        phone,
        step.message,
        step.buttons.map((b) => ({ id: b.id, title: b.text }))
      );
    } else if (step.message) {
      await this.sendTextMessage(phone, step.message);
    }

    // Auto-advance if no buttons
    if (!step.buttons && step.nextStep) {
      state.currentStep = step.nextStep;
      await this.executeStep(phone, state, flow);
    }
  }

  /**
   * Handle response to a step
   */
  private async handleStepResponse(
    phone: string,
    state: ConversationState,
    flow: ChatbotFlow,
    message: WhatsAppMessage
  ): Promise<void> {
    const currentStep = flow.steps.find((s) => s.id === state.currentStep);
    if (!currentStep) return;

    // Check if response matches a button
    if (currentStep.buttons && message.button) {
      const button = currentStep.buttons.find((b) => b.id === message.button?.id);
      if (button) {
        state.currentStep = button.nextStep;
        if (button.action) {
          await this.executeAction(phone, button.action, state);
        }
        await this.executeStep(phone, state, flow);
        return;
      }
    }

    // Check if response matches button text
    if (currentStep.buttons && message.text) {
      const text = message.text.toLowerCase();
      const button = currentStep.buttons.find(
        (b) => b.text.toLowerCase().includes(text) || text.includes(b.text.toLowerCase())
      );
      if (button) {
        state.currentStep = button.nextStep;
        if (button.action) {
          await this.executeAction(phone, button.action, state);
        }
        await this.executeStep(phone, state, flow);
        return;
      }
    }

    // Store response in context
    if (message.text) {
      state.context.lastInput = message.text;
    }

    // Auto-advance to next step
    if (currentStep.nextStep) {
      state.currentStep = currentStep.nextStep;
      await this.executeStep(phone, state, flow);
    }
  }

  /**
   * Execute a chatbot action
   */
  private async executeAction(phone: string, action: ChatbotAction, state: ConversationState): Promise<void> {
    switch (action.type) {
      case 'lookup_order':
        // TODO: Look up order from database
        state.context.orderFound = true;
        break;
      case 'send_catalog':
        // Catalog is sent via message
        break;
      case 'create_ticket':
        // TODO: Create support ticket
        break;
      case 'send_location':
        // TODO: Send location via WhatsApp API
        break;
      case 'escalate':
        // TODO: Notify human agent
        break;
    }
  }
}

export const whatsapp = new WhatsAppClient();
