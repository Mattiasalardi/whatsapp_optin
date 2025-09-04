// Centralized WhatsApp env handling (single source of truth)
// Load dotenv only in development
if (process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
  } catch {}
}

export type WAEnvStatus = {
  official: {
    WHATSAPP_TOKEN: boolean;
    WABA_PHONE_NUMBER_ID: boolean;
    WELCOME_TEMPLATE_NAME: boolean;
    WELCOME_TEMPLATE_LANG: boolean;
  };
  aliases: {
    WHATSAPP_ACCESS_TOKEN: boolean;
    PHONE_NUMBER_ID: boolean;
  };
};

// Reads env with alias fallbacks
export function resolveWAEnv() {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneId = process.env.WABA_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || '';
  const templateName = process.env.WELCOME_TEMPLATE_NAME || 'offerta_di_benvenuto';
  const templateLang = process.env.WELCOME_TEMPLATE_LANG || 'it';
  return { token, phoneId, templateName, templateLang } as const;
}

// Returns normalized config; throws when strict and critical are missing
export function getWAConfig(options?: { strict?: boolean }) {
  const { token, phoneId, templateName, templateLang } = resolveWAEnv();
  if (options?.strict) {
    const missing: string[] = [];
    if (!token) missing.push('WHATSAPP_TOKEN');
    if (!phoneId) missing.push('WABA_PHONE_NUMBER_ID');
    if (missing.length) {
      const err = new Error('Missing critical WA env: ' + missing.join(','));
      (err as any).missing = missing;
      throw err;
    }
  }
  return { token, phoneNumberId: phoneId, templateName, templateLang } as const;
}

// Presence booleans for official vars and aliases
export function waEnvStatus(): WAEnvStatus {
  return {
    official: {
      WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN),
      WABA_PHONE_NUMBER_ID: Boolean(process.env.WABA_PHONE_NUMBER_ID),
      WELCOME_TEMPLATE_NAME: Boolean(process.env.WELCOME_TEMPLATE_NAME),
      WELCOME_TEMPLATE_LANG: Boolean(process.env.WELCOME_TEMPLATE_LANG),
    },
    aliases: {
      WHATSAPP_ACCESS_TOKEN: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      PHONE_NUMBER_ID: Boolean(process.env.PHONE_NUMBER_ID),
    },
  } as const;
}

// Logs presence (never values)
export function logWAEnvStatus(prefix = '[env]') {
  console.log(prefix, waEnvStatus());
}



