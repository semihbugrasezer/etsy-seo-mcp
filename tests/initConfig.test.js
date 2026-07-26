import { describe, it, mock, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  initConfig,
  getRuntimeConfigState,
  setRuntimeConfig,
} from '../mcp-server.js';
import { DEFAULT_HOST } from '../utils.js';

describe('initConfig', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear relevant environment variables to ensure a clean state
    delete process.env.SEERXO_EMAIL;
    delete process.env.EMAIL;
    delete process.env.SEERXO_API_KEY;
    delete process.env.MCP_API_KEY;
    delete process.env.SEERXO_HOST;
    delete process.env.API_BASE;

    // Clear runtime config state
    setRuntimeConfig({ email: null, apiKey: null, host: DEFAULT_HOST });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    mock.restoreAll();
  });

  it('should use environment variables over local config', async () => {
    process.env.SEERXO_EMAIL = 'env@example.com';
    process.env.SEERXO_API_KEY = 'envKeyId.envSecret1234567890';
    process.env.SEERXO_HOST = 'https://env.api.com';

    mock.method(fsPromises, 'readFile', async () => {
      return JSON.stringify({
        email: 'local@example.com',
        apiKey: 'localKeyId.localSecret1234567890',
        host: 'https://local.api.com',
      });
    });

    await initConfig();

    const state = getRuntimeConfigState();
    assert.strictEqual(state.email, 'env@example.com');
    assert.strictEqual(state.host, 'https://env.api.com');
    assert.strictEqual(state.hasValidApiKey, true);
  });

  it('should fallback to local config when env vars are missing', async () => {
    const readFileMock = mock.method(fsPromises, 'readFile', async () => {
      return JSON.stringify({
        email: 'local@example.com',
        apiKey: 'localKeyId.localSecret1234567890',
        host: 'https://local.api.com',
      });
    });

    await initConfig();

    assert.deepStrictEqual(readFileMock.mock.calls[0].arguments, [
      path.join(os.homedir(), '.seerxo-mcp', 'config.json'),
      'utf8',
    ]);

    const state = getRuntimeConfigState();
    assert.strictEqual(state.email, 'local@example.com');
    assert.strictEqual(state.host, 'https://local.api.com');
    assert.strictEqual(state.hasValidApiKey, true);
  });

  it('should use DEFAULT_HOST and nulls when both env vars and local config are missing', async () => {
    mock.method(fsPromises, 'readFile', async () => {
      return '{}';
    });

    await initConfig();

    const state = getRuntimeConfigState();
    assert.strictEqual(state.email, null);
    assert.strictEqual(state.host, DEFAULT_HOST);
    assert.strictEqual(state.hasValidApiKey, false);
  });

  it('should handle fsPromises.readFile throwing an error (e.g. file not found)', async () => {
    mock.method(fsPromises, 'readFile', async () => {
      throw new Error('ENOENT: no such file or directory');
    });

    await initConfig();

    const state = getRuntimeConfigState();
    assert.strictEqual(state.email, null);
    assert.strictEqual(state.host, DEFAULT_HOST);
    assert.strictEqual(state.hasValidApiKey, false);
  });

  it('should use secondary env vars (EMAIL, MCP_API_KEY, API_BASE) if primary ones are absent', async () => {
    process.env.EMAIL = 'secondary@example.com';
    process.env.MCP_API_KEY = 'secondaryKeyId.secondarySecret123456';
    process.env.API_BASE = 'https://secondary.api.com';

    mock.method(fsPromises, 'readFile', async () => {
      return '{}';
    });

    await initConfig();

    const state = getRuntimeConfigState();
    assert.strictEqual(state.email, 'secondary@example.com');
    assert.strictEqual(state.host, 'https://secondary.api.com');
    assert.strictEqual(state.hasValidApiKey, true);
  });
});
