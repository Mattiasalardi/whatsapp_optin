export const dynamic = 'force-dynamic';

function getPortFromEnvOrDefault(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || '';
  const match = url.match(/:(\d+)/);
  if (match) return match[1];
  return process.env.PORT || '3000';
}

export default function EnvDebugPage() {
  const flags = {
    WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN),
    WHATSAPP_ACCESS_TOKEN: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    WABA_PHONE_NUMBER_ID: Boolean(process.env.WABA_PHONE_NUMBER_ID),
    PHONE_NUMBER_ID: Boolean(process.env.PHONE_NUMBER_ID),
    WELCOME_TEMPLATE_NAME: Boolean(process.env.WELCOME_TEMPLATE_NAME),
    WELCOME_TEMPLATE_LANG: Boolean(process.env.WELCOME_TEMPLATE_LANG),
  } as const;
  const port = getPortFromEnvOrDefault();
  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>Env Debug</h1>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left', background: '#f7f7f7' }}>Variable</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left', background: '#f7f7f7' }}>Present</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(flags).map(([k, v]) => (
            <tr key={k}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{k}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: '#555' }}>I valori NON vengono mostrati, solo la presenza.</p>
      <h2>Variabili ufficiali e alias</h2>
      <ul>
        <li>Token ufficiale: <code>WHATSAPP_TOKEN</code> (alias: <code>WHATSAPP_ACCESS_TOKEN</code>)</li>
        <li>Phone number ID ufficiale: <code>WABA_PHONE_NUMBER_ID</code> (alias: <code>PHONE_NUMBER_ID</code>)</li>
      </ul>
      <h2>Percorsi file env</h2>
      <ul>
        <li>Root del progetto: <code>.env.local</code> (prioritario in dev)</li>
        <li>Root del progetto: <code>.env</code></li>
      </ul>
      <h3>Diagnostica percorso</h3>
      <ul>
        <li>process.cwd(): <code>{process.cwd()}</code></li>
        <li>Nota: le env sono lette centralmente da <code>src/lib/env.ts</code></li>
      </ul>
      <h2>Porta dev</h2>
      <p>Running on port: <strong>{port}</strong> (es. 3000/3001)</p>
      <p>In dev Next può cambiare porta se 3000 è occupata; usa <code>http://localhost:{'{'}PORT{'}'}</code> ad es. <code>http://localhost:3001/demo</code>.</p>
      <p><a href={`/demo`}>Apri la demo</a></p>
    </div>
  );
}


