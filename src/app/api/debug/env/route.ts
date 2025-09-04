import { NextResponse } from 'next/server';
import { waEnvStatus } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const flags = waEnvStatus();

  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Env Debug</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:16px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}th{text-align:left;background:#f7f7f7}</style>
  </head>
  <body>
    <h1>Env Debug</h1>
    <table>
      <thead><tr><th>Variable</th><th>Present</th></tr></thead>
      <tbody>
        <tr><td>WHATSAPP_TOKEN</td><td>${flags.official.WHATSAPP_TOKEN}</td></tr>
        <tr><td>WHATSAPP_ACCESS_TOKEN (alias)</td><td>${flags.aliases.WHATSAPP_ACCESS_TOKEN}</td></tr>
        <tr><td>WABA_PHONE_NUMBER_ID</td><td>${flags.official.WABA_PHONE_NUMBER_ID}</td></tr>
        <tr><td>PHONE_NUMBER_ID (alias)</td><td>${flags.aliases.PHONE_NUMBER_ID}</td></tr>
        <tr><td>WELCOME_TEMPLATE_NAME</td><td>${flags.official.WELCOME_TEMPLATE_NAME}</td></tr>
        <tr><td>WELCOME_TEMPLATE_LANG</td><td>${flags.official.WELCOME_TEMPLATE_LANG}</td></tr>
        <tr><td>WELCOME_TEMPLATE_NAME</td><td>${flags.WELCOME_TEMPLATE_NAME}</td></tr>
        <tr><td>WELCOME_TEMPLATE_LANG</td><td>${flags.WELCOME_TEMPLATE_LANG}</td></tr>
      </tbody>
    </table>
    <p style="color:#555">Nota: i valori non vengono mostrati, solo la presenza.</p>
  </body>
 </html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}


