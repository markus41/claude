export async function emitWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  const url = process.env['SCRAPIN_ALERT_WEBHOOK_URL'];
  if (!url) return;

  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
  }).catch(() => undefined);
}
