import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/db';
import { generatePromoCode, sendWelcomeTemplate } from '../../../lib/whatsapp';
import { rateLimitByIp } from '../../../lib/rateLimit';
import { waEnvStatus, logWAEnvStatus } from '@/lib/env';

const SubscribeSchema = z.object({
  tenant_id: z.string().min(1),
  phone: z.string().min(5),
  wa_optin: z.boolean(),
  policy_version: z.string().min(1),
  source: z.string().optional(),
  first_name: z.string().optional(),
});

function normalizeItalianPhone(phoneRaw: string): string {
  const cleaned = phoneRaw.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('39')) return `+${cleaned}`;
  return `+39${cleaned.replace(/^0+/, '')}`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown';
  const rl = rateLimitByIp(ip, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited', resetAt: rl.resetAt }, { status: 429 });
  }

  let payload: z.infer<typeof SubscribeSchema>;
  try {
    const json = await req.json();
    payload = SubscribeSchema.parse(json);
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'invalid_request', details: (err as Error).message }, { status: 400 });
  }

  const phoneE164 = normalizeItalianPhone(payload.phone);

  const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenant_id } });
  if (!tenant) {
    return NextResponse.json({ ok: false, error: 'tenant_not_found' }, { status: 404 });
  }

  const contact = await prisma.contact.upsert({
    where: { tenantId_phoneE164: { tenantId: tenant.id, phoneE164 } },
    update: {
      status: payload.wa_optin ? 'subscribed' : 'unsubscribed',
      firstName: payload.first_name,
      policyVersion: payload.policy_version,
      source: payload.source ?? 'qr-menu',
    },
    create: {
      tenantId: tenant.id,
      phoneE164,
      status: payload.wa_optin ? 'subscribed' : 'unsubscribed',
      firstName: payload.first_name,
      policyVersion: payload.policy_version,
      source: payload.source ?? 'qr-menu',
    },
  });

  await prisma.consentLog.create({
    data: {
      tenantId: tenant.id,
      contactId: contact.id,
      phoneE164,
      waOptIn: payload.wa_optin,
      policyVersion: payload.policy_version,
      ip,
      userAgent: req.headers.get('user-agent') || undefined,
      source: payload.source ?? 'qr-menu',
    },
  });

  // Env diagnostics
  logWAEnvStatus('[subscribe]');

  let waSkipped = false;
  let missing: string[] = [];
  const status = waEnvStatus();
  if (!(status.official.WHATSAPP_TOKEN || status.aliases.WHATSAPP_ACCESS_TOKEN)) missing.push('WHATSAPP_TOKEN');
  if (!(status.official.WABA_PHONE_NUMBER_ID || status.aliases.PHONE_NUMBER_ID)) missing.push('WABA_PHONE_NUMBER_ID');
  if (missing.length) {
    console.warn('[subscribe] Missing env after checking aliases', status);
  }

  // Dev-only overrides
  let overrideToken: string | undefined;
  let overridePhoneId: string | undefined;
  if (process.env.NODE_ENV === 'development') {
    try {
      const json = await req.clone().json();
      const devKey = json?.dev_key as string | undefined;
      const devOverrides = json?.dev_overrides as { waToken?: string; phoneId?: string } | undefined;
      if (devOverrides && devKey && process.env.DEV_API_KEY && devKey === process.env.DEV_API_KEY) {
        overrideToken = devOverrides.waToken || undefined;
        overridePhoneId = devOverrides.phoneId || undefined;
        if (overrideToken) missing = missing.filter((m) => m !== 'WHATSAPP_TOKEN');
        if (overridePhoneId) missing = missing.filter((m) => m !== 'WABA_PHONE_NUMBER_ID');
        console.log('[subscribe] Using dev overrides for this request');
      }
    } catch {}
  }

  // Fire-and-forget WhatsApp send
  if (payload.wa_optin && missing.length === 0) {
    const promo = generatePromoCode();
    const toForWA = phoneE164.replace(/^\+/, '');
    sendWelcomeTemplate({
      toPhoneE164: toForWA,
      firstName: contact.firstName,
      restaurantName: tenant.name,
      giftLabel: tenant.giftLabel,
      promoCode: promo,
      phoneNumberId: overridePhoneId || tenant.wabaPhoneNumberId || undefined,
      language: tenant.defaultLanguage || undefined,
    }, overrideToken).then((res) => {
      if (!res.ok) {
        console.error('WhatsApp send non-blocking failure', res.status);
      }
    }).catch((e) => console.error('WhatsApp send error', e));
  } else if (payload.wa_optin && missing.length > 0) {
    waSkipped = true;
    console.warn('WhatsApp send skipped due to missing env:', missing);
  }

  return NextResponse.json({ ok: true, contactId: contact.id, waSkipped: waSkipped || undefined, reason: waSkipped ? 'missing_env' : undefined, missing: waSkipped ? missing : undefined });
}

