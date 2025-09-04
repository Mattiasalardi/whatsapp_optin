import { fetch } from 'undici';
import { getWAConfig } from '@/lib/env';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

export type WhatsAppTemplateParams = {
  toPhoneE164: string; // should be without '+' for WA; caller handles normalization
  firstName?: string | null;
  restaurantName: string;
  giftLabel: string;
  promoCode: string;
  templateName?: string; // default from env
  language?: string; // default from env
  phoneNumberId?: string; // tenant override else env
};

export async function sendWelcomeTemplate(
  params: WhatsAppTemplateParams,
  tokenOverride?: string
): Promise<{ ok: boolean; status: number; body?: unknown }>{
  const wa = getWAConfig();
  const token = tokenOverride || wa.token;
  const defaultPhoneNumberId = wa.phoneNumberId;
  const templateName = params.templateName || wa.templateName;
  const language = params.language || wa.templateLang;

  if (!token || !(params.phoneNumberId || defaultPhoneNumberId)) {
    console.error('WhatsApp env missing. Skipping send.');
    return { ok: false, status: 0 };
  }

  const name = params.firstName && params.firstName.trim() !== '' ? params.firstName : 'Amico';
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: params.restaurantName },
        { type: 'text', text: params.giftLabel },
        { type: 'text', text: params.promoCode },
      ],
    },
  ];

  const body = {
    messaging_product: 'whatsapp',
    to: params.toPhoneE164,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  };

  const url = `${GRAPH_BASE}/${params.phoneNumberId || defaultPhoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch {}
    if (!res.ok) {
      const code = (data && typeof data === 'object' && 'error' in (data as any) && (data as any).error && (data as any).error.code) ? (data as any).error.code : undefined;
      const hints: Record<number, string> = {
        132001: 'Template o lingua non trovati.',
        132000: 'Numero parametri del template non corrisponde.',
        131051: 'phone_number_id non appartiene al WABA del token.',
        133010: 'Account/numero non registrato su Cloud API.',
      };
      const hint = typeof code === 'number' ? hints[code] : undefined;
      console.error('WhatsApp send failed', res.status, { code, hint, response: text });
      return { ok: false, status: res.status, body: data ?? text };
    }
    return { ok: true, status: res.status, body: data ?? text };
  } catch (err) {
    console.error('WhatsApp send error', err);
    return { ok: false, status: 0 };
  }
}

export function generatePromoCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VOUCH-';
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

