import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeTemplate } from '../../../../lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'not_available_in_production' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const to = String(body?.to || '');
  if (!to) {
    return NextResponse.json({ ok: false, error: 'missing_to' }, { status: 400 });
  }

  let tokenOverride: string | undefined;
  let phoneIdOverride: string | undefined;
  const devKey = body?.dev_key as string | undefined;
  const overrides = body?.dev_overrides as { waToken?: string; phoneId?: string } | undefined;
  if (overrides && devKey && process.env.DEV_API_KEY && devKey === process.env.DEV_API_KEY) {
    tokenOverride = overrides.waToken || undefined;
    phoneIdOverride = overrides.phoneId || undefined;
  }

  const res = await sendWelcomeTemplate({
    toPhoneE164: to,
    firstName: 'Amico',
    restaurantName: 'Trattoria Demo',
    giftLabel: 'calice di vino',
    promoCode: 'VOUCH-XXXXX',
    phoneNumberId: phoneIdOverride || undefined,
    language: 'it',
  }, tokenOverride);

  return NextResponse.json(res);
}



