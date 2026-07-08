import { parseEnvFile, resolveProviderOrder, loadAIConfig } from './provider';

describe('provider helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('parses dotenv-style content without extra dependencies', () => {
    const parsed = parseEnvFile(`
      # comment
      OPENROUTER_API_KEY="router-key"
      OPENAI_API_KEY=openai-key
      AI_PROVIDER=local
    `);

    expect(parsed).toEqual({
      OPENROUTER_API_KEY: 'router-key',
      OPENAI_API_KEY: 'openai-key',
      AI_PROVIDER: 'local',
    });
  });

  it('starts provider fallbacks with the configured provider', () => {
    expect(resolveProviderOrder('openrouter')).toEqual(['openrouter', 'openai', 'local']);
    expect(resolveProviderOrder('openai')).toEqual(['openai', 'openrouter', 'local']);
    expect(resolveProviderOrder('local')).toEqual(['local', 'openrouter', 'openai']);
  });

  it('loads sane defaults when no .env file is present', () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    delete process.env.LOCAL_MODEL_URL;

    const config = loadAIConfig(__dirname);

    expect(config.provider).toBe('openrouter');
    expect(config.openRouterModel).toBe('openai/gpt-oss-20b:free');
    expect(config.openRouterFallbackModel).toBe('meta-llama/llama-3.3-70b-instruct:free');
    expect(config.localModelUrl).toBe('http://127.0.0.1:11434/api/chat');
  });
});
