// Runs inside the page, next to gymi: it answers for the coach by calling Claude with the official SDK and the
// phone owner's own API key. The SDK supports browsers but not React Native, so it lives on the page side of the shell.
// scripts/sync-web.js bundles this file into src/coachBundle.js.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';

/* SDK errors, most specific first, as the short codes the page already knows how to explain */
function codeOf(e) {
  if (e instanceof Anthropic.APIUserAbortError) return 'cancelled';
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return 'bad_key';
  if (e instanceof Anthropic.RateLimitError) return 'rate_limited';
  if (e instanceof Anthropic.APIConnectionError) return 'offline';
  if (e instanceof Anthropic.APIError) return e.status >= 500 ? 'upstream_error' : 'api_error';
  return 'upstream_error';
}

/* one question to the coach. messages: [{ role, content }], images: base64 JPEGs for the last message */
window.gymiAsk = async function ({ key, system, messages, images, signal, onText }) {
  // The key belongs to the person holding the phone and is sent only to Anthropic, so the SDK's browser guard is lifted on purpose.
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 });
  const msgs = messages.map((m) => ({ role: m.role, content: m.content }));
  if (images && images.length) {
    const last = msgs[msgs.length - 1];
    last.content = images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })).concat([{ type: 'text', text: String(last.content) }]);
  }
  let text = '';
  try {
    const body = {
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      // if a safety classifier declines the request, the API re-runs it on a fallback model inside the same call
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: msgs,
    };
    if (system) body.system = system;
    const stream = client.beta.messages.stream(body, { signal });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        text += event.delta.text;
        if (onText) onText({ text, delta: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') return Promise.reject({ code: 'refused', message: 'refused' });
    return { text: final.content.filter((b) => b.type === 'text').map((b) => b.text).join(''), truncated: final.stop_reason === 'max_tokens' };
  } catch (e) {
    return Promise.reject({ code: codeOf(e), message: (e && e.message) || '', text });
  }
};
