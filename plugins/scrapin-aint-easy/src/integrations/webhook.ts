import { createLogger } from '../core/logger.js';
import { isPublicHttpsUrl } from '../core/url-guard.js';

const logger = createLogger('webhook');

let cachedValidatedUrl: string | undefined;
let urlChecked = false;

function validatedWebhookUrl(): string | undefined {
  if (urlChecked) return cachedValidatedUrl;
  urlChecked = true;
  const raw = process.env['SCRAPIN_ALERT_WEBHOOK_URL'];
  if (!raw) return undefined;
  if (!isPublicHttpsUrl(raw)) {
    logger.warn(
      { url: raw },
      'SCRAPIN_ALERT_WEBHOOK_URL rejected — must be https and must not target a private/loopback/link-local host. Webhook disabled.',
    );
    return undefined;
  }
  cachedValidatedUrl = raw;
  return cachedValidatedUrl;
}

export async function emitWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  const url = validatedWebhookUrl();
  if (!url) return;

  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
  }).catch(() => undefined);
}
