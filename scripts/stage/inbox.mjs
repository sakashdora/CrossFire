// Mailpit test inbox (the Supabase CLI local_smtp service). Message bodies and
// tokens stay in memory and are never printed.
export function extractAuthTokens(body) {
  const text = String(body || '').replace(/&amp;/g, '&');
  const found = { tokenHash: '', type: '', code: '' };
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/g)) {
    const url = new URL(match[0]);
    if (url.searchParams.get('token')) { found.tokenHash = url.searchParams.get('token'); found.type = url.searchParams.get('type') || ''; break; }
  }
  const code = text.match(/(?:code|otp|token)[^0-9]{0,60}\b(\d{6})\b/i);
  if (code) found.code = code[1];
  return found;
}

export function createInbox(mailUrl, fetch) {
  const json = async path => {
    const response = await fetch(mailUrl + path, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw Object.assign(new Error('inbox'), { safeMessage: `Test inbox returned HTTP ${response.status}.` });
    return response.json();
  };
  const messagesTo = async address => {
    const result = await json('/api/v1/search?limit=20&query=' + encodeURIComponent(`to:"${address}"`));
    return (result.messages || []).filter(item => (item.To || []).some(to => String(to.Address).toLowerCase() === address));
  };
  return {
    async ready() { await json('/api/v1/messages?limit=1'); return true; },
    async existingIds(address) { return new Set((await messagesTo(address)).map(item => item.ID)); },
    // Newest message to this address created at or after `since`, or null.
    async waitFor(address, since, timeoutMs = 12000, exclude = new Set()) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const message = (await messagesTo(address))
          .filter(item => !exclude.has(item.ID) && Date.parse(item.Created) >= since - 1000)
          .sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created))[0];
        if (message) {
          const full = await json('/api/v1/message/' + encodeURIComponent(message.ID));
          return { subject: message.Subject || '', tokens: extractAuthTokens((full.HTML || '') + '\n' + (full.Text || '')) };
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return null;
    },
  };
}
