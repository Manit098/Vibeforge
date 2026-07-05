import fs from 'fs';
import path from 'path';
import { loadConfig } from '../utils/fs';

export type AIProviderName = 'openrouter' | 'openai' | 'local';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
}

export interface AIResponse {
  text: string;
  provider: AIProviderName;
  model: string;
}

export interface AIConfig {
  provider?: AIProviderName;
  openRouterApiKey?: string;
  openRouterModel: string;
  openRouterFallbackModel: string;
  openAiApiKey?: string;
  openAiModel: string;
  localModelUrl?: string;
  localModelName?: string;
  openRouterAppUrl?: string;
  openRouterAppName: string;
}

interface VibeForgeAIConfig {
  aiProvider?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  openRouterFallbackModel?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  localModelUrl?: string;
  localModelName?: string;
  openRouterHttpReferer?: string;
  openRouterXTitle?: string;
}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface ChatChoice {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
}

interface ChatCompletionResponse {
  choices?: ChatChoice[];
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
  response?: string;
  error?: {
    message?: string;
  };
}

const DEFAULT_SYSTEM_PROMPT =
  'You are VibeForge, a project-aware AI assistant. Answer using the provided project artifacts, call out uncertainty when context is incomplete, and stay grounded in the supplied workspace context.';

const normalizeProviderName = (value?: string): AIProviderName | undefined => {
  if (value === 'openai' || value === 'local' || value === 'openrouter') {
    return value;
  }
  return undefined;
};

export const parseEnvFile = (content: string): Record<string, string> => {
  return content.split(/\r?\n/).reduce<Record<string, string>>((acc, rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      return acc;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      return acc;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

export const loadAIConfig = (cwd: string = process.cwd()): AIConfig => {
  const envPath = path.join(cwd, '.env');
  const fileEnv = fs.existsSync(envPath) ? parseEnvFile(fs.readFileSync(envPath, 'utf-8')) : {};
  const env = { ...fileEnv, ...process.env };

  const config = loadConfig(cwd);
  const aiConfig = config as unknown as { ai?: VibeForgeAIConfig } & Record<string, unknown>;
  const aiFromJson = aiConfig.ai || {};

  return {
    provider: normalizeProviderName(aiFromJson.aiProvider || env.AI_PROVIDER) || 'openrouter',
    openRouterApiKey: aiFromJson.openRouterApiKey || env.OPENROUTER_API_KEY,
    openRouterModel:
      aiFromJson.openRouterModel || env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free',
    openRouterFallbackModel:
      aiFromJson.openRouterFallbackModel ||
      env.OPENROUTER_FALLBACK_MODEL ||
      'meta-llama/llama-3.3-70b-instruct:free',
    openAiApiKey: aiFromJson.openAiApiKey || env.OPENAI_API_KEY,
    openAiModel: aiFromJson.openAiModel || env.OPENAI_MODEL || 'gpt-4o-mini',
    localModelUrl:
      aiFromJson.localModelUrl || env.LOCAL_MODEL_URL || 'http://127.0.0.1:11434/api/chat',
    localModelName: aiFromJson.localModelName || env.LOCAL_MODEL_NAME,
    openRouterAppUrl: aiFromJson.openRouterHttpReferer || env.OPENROUTER_HTTP_REFERER,
    openRouterAppName: aiFromJson.openRouterXTitle || env.OPENROUTER_X_TITLE || 'VibeForge',
  };
};

export const resolveProviderOrder = (preferredProvider: AIProviderName): AIProviderName[] => {
  switch (preferredProvider) {
    case 'openai':
      return ['openai', 'openrouter', 'local'];
    case 'local':
      return ['local', 'openrouter', 'openai'];
    case 'openrouter':
    default:
      return ['openrouter', 'openai', 'local'];
  }
};

const getAISetupHelp = (): string => {
  return `AI is not configured for this package yet.

Create a project-level .env file, or set environment variables yourself:

AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENAI_API_KEY=
LOCAL_MODEL_URL=http://127.0.0.1:11434/api/chat
LOCAL_MODEL_NAME=llama3.2

Notes:
- VibeForge does not create or fill these values automatically.
- Use AI_PROVIDER=openrouter, openai, or local.
- Only the provider you choose needs to be fully configured.`;
};

const ensureUserConfiguredProvider = (config: AIConfig): AIProviderName => {
  if (!config.provider) {
    throw new Error(getAISetupHelp());
  }

  if (config.provider === 'openrouter' && !config.openRouterApiKey) {
    throw new Error('AI_PROVIDER is set to openrouter but OPENROUTER_API_KEY is missing.');
  }

  if (config.provider === 'openai' && !config.openAiApiKey) {
    throw new Error('AI_PROVIDER is set to openai but OPENAI_API_KEY is missing.');
  }

  if (config.provider === 'local' && (!config.localModelUrl || !config.localModelName)) {
    throw new Error(
      'AI_PROVIDER is set to local but LOCAL_MODEL_URL or LOCAL_MODEL_NAME is missing.'
    );
  }

  return config.provider;
};

const readResponseBody = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text) as ChatCompletionResponse;
    return parsed.error?.message || text;
  } catch {
    return text;
  }
};

const extractTextFromContent = (
  content?: string | Array<{ type?: string; text?: string }>
): string => {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part?.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
};

const extractAssistantText = (data: ChatCompletionResponse): string => {
  const fromChoices = extractTextFromContent(data.choices?.[0]?.message?.content);
  if (fromChoices) {
    return fromChoices;
  }

  const fromMessage = extractTextFromContent(data.message?.content);
  if (fromMessage) {
    return fromMessage;
  }

  if (typeof data.response === 'string') {
    return data.response.trim();
  }

  return '';
};

const postChatCompletion = async (
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<ChatCompletionResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readResponseBody(response));
  }

  return (await response.json()) as ChatCompletionResponse;
};

const requestOpenRouter = async (request: AIRequest, config: AIConfig): Promise<AIResponse> => {
  if (!config.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.openRouterApiKey}`,
    'Content-Type': 'application/json',
    'X-Title': config.openRouterAppName,
  };

  if (config.openRouterAppUrl) {
    headers['HTTP-Referer'] = config.openRouterAppUrl;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: request.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    { role: 'user', content: request.prompt },
  ];

  const models = [config.openRouterModel, config.openRouterFallbackModel].filter(Boolean);
  let lastError: Error | undefined;

  for (const model of models) {
    try {
      const data = await postChatCompletion(
        'https://openrouter.ai/api/v1/chat/completions',
        headers,
        {
          model,
          messages,
        }
      );

      const text = extractAssistantText(data);
      if (!text) {
        throw new Error(`OpenRouter returned an empty response for model "${model}".`);
      }

      return {
        text,
        provider: 'openrouter',
        model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('OpenRouter request failed.');
};

const requestOpenAI = async (request: AIRequest, config: AIConfig): Promise<AIResponse> => {
  if (!config.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const data = await postChatCompletion(
    'https://api.openai.com/v1/chat/completions',
    {
      Authorization: `Bearer ${config.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    {
      model: config.openAiModel,
      messages: [
        { role: 'system', content: request.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: 'user', content: request.prompt },
      ],
    }
  );

  const text = extractAssistantText(data);
  if (!text) {
    throw new Error(`OpenAI returned an empty response for model "${config.openAiModel}".`);
  }

  return {
    text,
    provider: 'openai',
    model: config.openAiModel,
  };
};

const requestLocalModel = async (request: AIRequest, config: AIConfig): Promise<AIResponse> => {
  if (!config.localModelUrl || !config.localModelName) {
    throw new Error('LOCAL_MODEL_URL or LOCAL_MODEL_NAME is not configured.');
  }

  const data = await postChatCompletion(
    config.localModelUrl,
    {
      'Content-Type': 'application/json',
    },
    {
      model: config.localModelName,
      stream: false,
      messages: [
        { role: 'system', content: request.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: 'user', content: request.prompt },
      ],
    }
  );

  const text = extractAssistantText(data);
  if (!text) {
    throw new Error(`Local model returned an empty response for model "${config.localModelName}".`);
  }

  return {
    text,
    provider: 'local',
    model: config.localModelName,
  };
};

export const requestAICompletion = async (
  request: AIRequest,
  cwd: string = process.cwd()
): Promise<AIResponse> => {
  const config = loadAIConfig(cwd);
  const errors: string[] = [];
  const provider = ensureUserConfiguredProvider(config);

  for (const currentProvider of resolveProviderOrder(provider)) {
    try {
      if (currentProvider === 'openrouter') {
        return await requestOpenRouter(request, config);
      }

      if (currentProvider === 'openai') {
        return await requestOpenAI(request, config);
      }

      return await requestLocalModel(request, config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${currentProvider}: ${message}`);
    }
  }

  throw new Error(
    `All AI providers failed.\n${errors.map((message) => `- ${message}`).join('\n')}`
  );
};
