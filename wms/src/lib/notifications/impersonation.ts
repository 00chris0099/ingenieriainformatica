import { prisma } from '@repo/prisma';
import { sendEmail } from '@/lib/notifications/email';
import { whatsapp } from '@/lib/whatsapp/client';
import { SUPER_ADMIN_EMAIL } from '@/lib/super-admin';

export interface ImpersonationEventUser {
  id: string;
  email: string;
  fullName?: string | null;
  role?: string;
}

export interface NotifyParams {
  action: 'impersonate' | 'impersonate_end' | 'impersonate_renew';
  admin: ImpersonationEventUser;
  target: ImpersonationEventUser;
  ipAddress?: string | null;
  expiresAt?: string;
  /** Quién cerró la sesión si no fue el propio impersonador (panel del super admin). */
  closedBy?: string;
  /** Motivo de la impersonación (compliance). */
  reason?: string;
  /** full | readonly */
  mode?: 'full' | 'readonly';
}

const EVENT_META: Record<
  NotifyParams['action'],
  { emoji: string; title: string; emailTitle: string; verb: string; bodyText: string; accent: string }
> = {
  impersonate: {
    emoji: '👁️',
    title: 'Impersonación iniciada',
    emailTitle: 'Modo soporte activado',
    verb: 'entró al portal de',
    bodyText: 'abrió una sesión temporal',
    accent: '#b45309',
  },
  impersonate_end: {
    emoji: '🔒',
    title: 'Impersonación finalizada',
    emailTitle: 'Sesión de soporte cerrada',
    verb: 'salió del portal de',
    bodyText: 'cerró la sesión temporal',
    accent: '#1d4ed8',
  },
  impersonate_renew: {
    emoji: '🔄',
    title: 'Impersonación renovada',
    emailTitle: 'Sesión de soporte renovada',
    verb: 'renovó su sesión temporal en el portal de',
    bodyText: 'renovó su sesión temporal por 1 hora más',
    accent: '#047857',
  },
};

export function impersonationSummary(params: NotifyParams): string {
  const meta = EVENT_META[params.action];
  const lines = [
    `${meta.emoji} ${meta.title}`,
    `👤 Quién: ${params.admin.fullName || params.admin.email} (${params.admin.email})`,
    `🎯 Cliente: ${params.target.fullName || params.target.email} (${params.target.email})`,
    params.mode === 'readonly' ? '👓 Modo: SOLO LECTURA (ver sin tocar)' : '',
    params.reason ? `📋 Motivo: ${params.reason}` : '',
    params.closedBy ? `🔒 Cerrada por: ${params.closedBy}` : '',
    params.expiresAt ? `⏳ Expira: ${new Date(params.expiresAt).toLocaleString('es-PE')}` : '',
    params.ipAddress ? `🌐 IP: ${params.ipAddress}` : '',
    `🕒 ${new Date().toLocaleString('es-PE')}`,
  ].filter(Boolean).join('\n');
  return lines;
}

export function impersonationEmailHtml(params: NotifyParams): string {
  const meta = EVENT_META[params.action];
  const accent = meta.accent;
  const rows = [
    ['Quién inició', `${params.admin.fullName || '—'} · ${params.admin.email}`],
    ['Cliente', `${params.target.fullName || '—'} · ${params.target.email}`],
    ...(params.mode === 'readonly' ? [['Modo', 'Solo lectura (ver sin tocar)']] : []),
    ...(params.reason ? [['Motivo', params.reason]] : []),
    ...(params.expiresAt ? [['Expira', new Date(params.expiresAt).toLocaleString('es-PE')]] : []),
    ...(params.closedBy ? [['Cerrada por', params.closedBy]] : []),
    ...(params.ipAddress ? [['Dirección IP', params.ipAddress]] : []),
    ['Fecha', new Date().toLocaleString('es-PE')],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="color:#6b7280;width:110px;vertical-align:top">${k}</td><td style="font-weight:600">${v}</td></tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <div style="background:${accent};color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px">${meta.emoji} ${meta.emailTitle}</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">${meta.verb} <strong>${params.target.fullName || params.target.email}</strong></p>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
        <p style="font-size:13px;color:#374151;line-height:1.7">
          Un miembro del equipo de la agencia <strong>${meta.bodyText}</strong> en el portal de un cliente. Esta actividad queda registrada en Auditoría & Logs.
        </p>
        <table style="width:100%;font-size:14px;line-height:1.8;margin-top:16px">${rows}</table>
        <p style="font-size:12px;color:#9ca3af;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px">
          Evento de seguridad · E-Store Agencia VPS
        </p>
      </div>
    </body>
    </html>
  `;
}

interface StaffTarget { id: string; email: string | null; phone: string | null; role: string }

/** Staff de la agencia (super_admin/admin) excepto el actor, con fallback al dueño. */
async function getStaffTargets(actorId: string): Promise<StaffTarget[]> {
  const targets: StaffTarget[] = [];
  try {
    const staff = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['super_admin', 'admin'] } },
      select: { id: true, email: true, phone: true, role: true },
    });
    const seen = new Set<string>();
    for (const u of staff) {
      if (u.id === actorId || seen.has(u.email)) continue;
      seen.add(u.email);
      targets.push(u);
    }
    if (targets.length === 0 && SUPER_ADMIN_EMAIL) {
      const owner = await prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL },
        select: { id: true, email: true, phone: true, role: true },
      });
      if (owner && owner.id !== actorId) targets.push(owner);
    }
  } catch (e) {
    console.error('[IMP NOTIFY targets]', (e as Error)?.message?.slice(0, 150));
  }
  return targets;
}

async function notifyTargetsChannels(targets: StaffTarget[], subject: string, body: string, html: string): Promise<void> {
  // 1) Cola in-app
  try {
    for (const t of targets) {
      await prisma.notificationQueue.create({
        data: {
          recipientId: t.id,
          recipientEmail: t.email,
          subject,
          body,
          channel: 'in-app',
          type: 'impersonation',
        },
      });
    }
  } catch (e) {
    console.error('[IMP NOTIFY queue]', (e as Error)?.message?.slice(0, 150));
  }
  // 2) Email
  try {
    const emails = Array.from(new Set(targets.map((t) => t.email).filter(Boolean) as string[]));
    if (emails.length > 0) {
      await sendEmail({ to: emails, subject, html });
    }
  } catch (e) {
    console.error('[IMP NOTIFY email]', (e as Error)?.message?.slice(0, 150));
  }
  // 3) WhatsApp
  try {
    const phones = Array.from(new Set(targets.map((t) => t.phone).filter(Boolean) as string[]));
    for (const phone of phones) {
      await whatsapp.sendTextMessage(phone.replace(/\D/g, ''), body);
    }
  } catch (e) {
    console.error('[IMP NOTIFY wa]', (e as Error)?.message?.slice(0, 150));
  }
}

/**
 * Notifica al super admin (y admins de la agencia) cuando se inicia, renueva o
 * termina una impersonación: cola in-app + email + WhatsApp. Fire-and-forget
 * por canal: un fallo nunca rompe el flujo de impersonación.
 */
export async function notifyImpersonationEvent(params: NotifyParams): Promise<void> {
  const targets = await getStaffTargets(params.admin.id);
  const body = impersonationSummary(params);
  await notifyTargetsChannels(
    targets,
    `${EVENT_META[params.action].emoji} ${EVENT_META[params.action].title} — ${params.target.email}`,
    body,
    impersonationEmailHtml(params)
  );
}

/**
 * Aviso de kill-switch: se cerraron TODAS las impersonaciones activas de golpe.
 */
export async function notifyImpersonationBulkClose(params: {
  count: number;
  closedBy: string;
  adminEmails: string[];
  ipAddress?: string | null;
}): Promise<void> {
  const targets = await getStaffTargets(''); // no excluye a nadie: es un evento global
  const title = '🛑 Todas las impersonaciones cerradas';
  const body = [
    title,
    `🚫 Se cerraron ${params.count} sesión(es) de soporte activa(s) de golpe.`,
    `👤 Cerradas por: ${params.closedBy}`,
    params.adminEmails.length > 0 ? `👥 Involucraban a: ${params.adminEmails.join(', ')}` : '',
    params.ipAddress ? `🌐 IP: ${params.ipAddress}` : '',
    `🕒 ${new Date().toLocaleString('es-PE')}`,
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <div style="background:#b91c1c;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px">🛑 Kill-switch: impersonaciones cerradas</h1>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
        <p style="font-size:14px;color:#374151;line-height:1.7">
          <strong>${params.count}</strong> sesión(es) de soporte activa(s) fueron cerradas en bloque por
          <strong>${params.closedBy}</strong>. Los navegadores afectados dejaron de ver los portales de los clientes.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:12px">
          Evento de seguridad · E-Store Agencia VPS
        </p>
      </div>
    </body>
    </html>
  `;
  await notifyTargetsChannels(targets, title, body, html);
}
