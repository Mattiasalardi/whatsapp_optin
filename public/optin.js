(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function create(tag, attrs) { const el = document.createElement(tag); if (attrs) Object.assign(el, attrs); return el; }

  function readScriptConfig() {
    const script = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    const cfg = {
      tenant: script.getAttribute('data-tenant') || 'RISTO_DEMO',
      policyVersion: script.getAttribute('data-policy-version') || 'v1',
      apiBase: script.getAttribute('data-api') || ''
    };
    if (!cfg.apiBase || cfg.apiBase.trim() === '') {
      try {
        cfg.apiBase = (location && location.origin ? location.origin : '') + '/api';
      } catch (_) {
        cfg.apiBase = '/api';
      }
    }
    return cfg;
  }

  function render() {
    const cfg = readScriptConfig();
    if ($('#wa-optin-card')) return;
    const container = create('div', { id: 'wa-optin-card' });
    container.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.12);padding:12px;max-width:320px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;';

    const title = create('div');
    title.innerHTML = '<strong>Offerta WhatsApp</strong> — lascia il tuo numero per un omaggio e offerte.';
    title.style.marginBottom = '8px';

    const form = create('form');
    form.innerHTML = ''+
      '<div style="display:flex; gap:8px; margin-bottom:8px">' +
        '<input name="first_name" placeholder="Nome (opzionale)" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px" />' +
      '</div>'+
      '<div style="display:flex; gap:8px; margin-bottom:8px">' +
        '<input name="phone" placeholder="Numero WhatsApp" required style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px" />' +
      '</div>'+
      '<label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:12px;color:#333">' +
        '<input name="wa_optin" type="checkbox" required style="margin-top:3px" />' +
        '<span>Acconsento a ricevere messaggi WhatsApp e accetto la privacy (v.<span id="policyVersion"></span>).</span>'+
      '</label>'+
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button type="button" id="skipBtn" style="background:#eee;border:1px solid #ddd;border-radius:8px;padding:8px 10px">Vedi il menù</button>'+
        '<button type="submit" style="background:#16a34a;color:#fff;border:0;border-radius:8px;padding:8px 12px">Iscriviti</button>'+
      '</div>';

    form.querySelector('#policyVersion').textContent = cfg.policyVersion;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {
        tenant_id: cfg.tenant,
        phone: String(fd.get('phone') || ''),
        wa_optin: !!fd.get('wa_optin'),
        policy_version: cfg.policyVersion,
        source: 'qr-menu',
        first_name: String(fd.get('first_name') || '') || undefined
      };
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Invio...';
      try {
        const res = await fetch(cfg.apiBase + '/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const ct = res.headers.get('content-type') || '';
        const isJson = ct.includes('application/json');
        const payload = isJson ? await res.json().catch(() => ({})) : await res.text();
        if (!res.ok) {
          const errMsg = isJson && payload && payload.error ? payload.error : String(payload || res.statusText || 'Errore');
          throw new Error(res.status + ': ' + errMsg);
        }
        const json = isJson ? payload : {};
        if (!json.ok) throw new Error(json.error || 'Errore');
        container.innerHTML = '<div style="padding:8px">Grazie! Controlla WhatsApp per il messaggio di benvenuto.</div>';
        setTimeout(() => container.remove(), 4000);
      } catch (err) {
        alert('Errore invio: ' + (err && err.message ? err.message : String(err)) + '\nSuggerimento: se vedi 405 controlla che l\'API esponga POST/OPTIONS.');
      } finally {
        btn.disabled = false; btn.textContent = 'Iscriviti';
      }
    });

    form.querySelector('#skipBtn').addEventListener('click', function () {
      container.remove();
    });

    container.appendChild(title);
    container.appendChild(form);
    document.body.appendChild(container);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    render();
  } else {
    document.addEventListener('DOMContentLoaded', render);
  }
})();

