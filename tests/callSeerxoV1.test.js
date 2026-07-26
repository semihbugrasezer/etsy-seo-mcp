import test from 'node:test';
import assert from 'node:assert';
import { callSeerxoV1, setRuntimeConfig } from '../mcp-server.js';

test('callSeerxoV1 throws wrapped error when fetchJson throws generic error', async (t) => {
  setRuntimeConfig({
    apiKey: 'test-key.1234567890123456',
    email: 'test@example.com',
    host: 'https://api.test.com'
  });

  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    const err = new Error('Test fetch error');
    err.status = 500;
    err.code = 'INTERNAL_ERROR';
    err.requestId = 'req-123';
    err.payload = { foo: 'bar' };
    throw err;
  };

  try {
    await callSeerxoV1('/test', { some: 'payload' });
    assert.fail('Should have thrown an error');
  } catch (error) {
    if (error.message === 'Should have thrown an error') throw error;
    assert.match(error.message, /Test fetch error/);
    assert.match(error.message, /req-123/);
    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.code, 'INTERNAL_ERROR');
    assert.strictEqual(error.requestId, 'req-123');
    assert.deepStrictEqual(error.payload, { foo: 'bar' });
    assert.strictEqual(error.cause.message, 'Test fetch error');
  }
});

test('callSeerxoV1 wraps error properly for 401 Unauthorized', async (t) => {
  setRuntimeConfig({
    apiKey: 'test-key.1234567890123456',
    email: 'test@example.com',
    host: 'https://api.test.com'
  });

  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    err.requestId = 'req-auth-1';
    throw err;
  };

  try {
    await callSeerxoV1('/test', { some: 'payload' });
    assert.fail('Should have thrown an error');
  } catch (error) {
    if (error.message === 'Should have thrown an error') throw error;
    assert.match(error.message, /Invalid API key \(Unauthorized\)/);
    assert.match(error.message, /req-auth-1/);
    assert.strictEqual(error.status, 401);
    assert.strictEqual(error.code, 'UNAUTHORIZED');
    assert.strictEqual(error.requestId, 'req-auth-1');
  }
});
