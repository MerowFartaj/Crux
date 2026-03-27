export { AI_PROMPTS } from '../shared/ai-prompts';

export type AIProvider = 'claude' | 'openai';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  costEstimate: string; // e.g. "~$0.01/query"
}

export const AI_MODELS: AIModelInfo[] = [
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'claude', costEstimate: '~$0.004/query' },
  { id: 'claude-sonnet-4-6-20250427', name: 'Claude Sonnet 4.6', provider: 'claude', costEstimate: '~$0.01/query' },
  { id: 'claude-opus-4-6-20250415', name: 'Claude Opus 4.6', provider: 'claude', costEstimate: '~$0.02/query' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', costEstimate: '~$0.001/query' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'openai', costEstimate: '~$0.002/query' },
];

export interface AISettings {
  provider: AIProvider;
  model: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

function getDefaultsForProvider(provider: AIProvider): string {
  return provider === 'claude' ? 'claude-haiku-4-5-20251001' : 'gpt-5-mini';
}

export async function askAI(
  prompt: string,
  systemPrompt: string,
  settings: AISettings,
  maxTokens: number = 512,
  timeoutMs: number = 30000
): Promise<string> {
  const { provider, model, anthropicApiKey, openaiApiKey } = settings;

  if (provider === 'claude') {
    if (!anthropicApiKey) throw new Error('Anthropic API key not configured. Set it in Settings (Cmd+,)');

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicApiKey });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const message = await client.messages.create({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const block = message.content[0];
      if (block.type === 'text') return block.text.trim();
      throw new Error('Unexpected response format');
    } finally {
      clearTimeout(timer);
    }
  }

  if (provider === 'openai') {
    if (!openaiApiKey) throw new Error('OpenAI API key not configured. Set it in Settings (Cmd+,)');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-5-mini',
          max_completion_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', response.status, JSON.stringify(errorBody));
        const msg = errorBody?.error?.message || `HTTP ${response.status}`;
        throw new Error(`OpenAI: ${msg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      if (!content) {
        console.warn('OpenAI returned empty content. Full response:', JSON.stringify(data).slice(0, 500));
      }
      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

// Streaming AI — calls onChunk with each text token as it arrives
export async function askAIStream(
  prompt: string,
  systemPrompt: string,
  settings: AISettings,
  onChunk: (text: string) => void,
  maxTokens: number = 1024,
): Promise<void> {
  const { provider, model, anthropicApiKey, openaiApiKey } = settings;

  if (provider === 'claude') {
    if (!anthropicApiKey) throw new Error('Anthropic API key not configured');
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicApiKey });

    const stream = await client.messages.stream({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    }
    return;
  }

  if (provider === 'openai') {
    if (!openaiApiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-5-mini',
        max_completion_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('OpenAI streaming API error:', response.status, JSON.stringify(errorBody));
      const msg = errorBody?.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI: ${msg}`);
    }
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          // GPT-5 models may use delta.content or output_text
          const choice = parsed.choices?.[0];
          const text = choice?.delta?.content
            ?? choice?.delta?.reasoning_content
            ?? choice?.text
            ?? '';
          if (text) onChunk(text);
        } catch (e) {
          console.warn('OpenAI stream chunk parse error:', data, e);
        }
      }
    }
    return;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// Helper to build AISettings from the electron-store
export function getAISettings(store: any): AISettings {
  const anthropicApiKey = (store.get('anthropicApiKey') as string) || '';
  const openaiApiKey = (store.get('openaiApiKey') as string) || '';
  let provider = (store.get('aiProvider') as AIProvider) || 'claude';
  let model = (store.get('aiModel') as string) || '';

  // Auto-fix: if selected provider has no key, switch to the one that does
  if (provider === 'claude' && !anthropicApiKey && openaiApiKey) {
    provider = 'openai';
    model = model.includes('gpt') ? model : 'gpt-5-mini';
  } else if (provider === 'openai' && !openaiApiKey && anthropicApiKey) {
    provider = 'claude';
    model = model.includes('claude') ? model : 'claude-haiku-4-5-20251001';
  }

  return { provider, model, anthropicApiKey, openaiApiKey };
}

// Get the cheapest available model for fast suggestions
export function getCheapModel(settings: AISettings): AISettings {
  if (settings.provider === 'openai' && settings.openaiApiKey) {
    return { ...settings, model: 'gpt-5-mini' };
  }
  if (settings.provider === 'claude' && settings.anthropicApiKey) {
    return { ...settings, model: 'claude-haiku-4-5-20251001' };
  }
  // Fallback: try whichever has a key
  if (settings.openaiApiKey) return { ...settings, provider: 'openai', model: 'gpt-5-mini' };
  if (settings.anthropicApiKey) return { ...settings, provider: 'claude', model: 'claude-haiku-4-5-20251001' };
  return settings;
}
