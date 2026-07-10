import { NextRequest, NextResponse } from 'next/server';
import { whatsapp } from '@/lib/whatsapp/client';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'adriskids_verify';

/**
 * GET - Webhook verification for WhatsApp Business
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST - Handle incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify this is a WhatsApp message
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const messages = change.value?.messages || [];
        for (const message of messages) {
          const from = message.from;
          const messageData = {
            from,
            to: change.value?.metadata?.phone_number_id || '',
            type: message.type,
            text: message.text?.body,
            button: message.interactive?.type === 'button_reply'
              ? { id: message.interactive.button_reply.id, text: message.interactive.button_reply.title }
              : undefined,
            interactive: message.interactive?.type === 'list_reply'
              ? { id: message.interactive.list_reply.id, title: message.interactive.list_reply.title }
              : undefined,
          };

          await whatsapp.processMessage(from, messageData);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
