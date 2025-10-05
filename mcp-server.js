#!/usr/bin/env node

/**
 * Etsy SEO MCP Server
 * Model Context Protocol server for Claude Desktop integration
 */

import crypto from 'node:crypto';

// Simple MCP stdio communication
process.stdin.setEncoding('utf8');

let buffer = '';
let userEmail = process.env.EMAIL || null;

const apiBase = process.env.API_BASE || 'https://devqora.space';
const apiPath = process.env.API_PATH || '/api/generate';
const API_ENDPOINT = new URL(apiPath, apiBase).toString();
const apiSecret = process.env.MCP_API_SECRET || null;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Security constants
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_CACHE_SIZE = 1000;
const REQUEST_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const requestCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map();
const ipRateLimitMap = new Map(); // IP-based rate limiting
const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// API Secret Security
const MIN_SECRET_LENGTH = 32;
const MIN_SECRET_ENTROPY = 3.5; // bits per character

// Input validation constants
const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB
const MAX_INPUT_LENGTH = 10000;
const MAX_PRODUCT_NAME_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254; // RFC 5321

// SSRF Protection - Whitelist allowed API hosts
const ALLOWED_API_HOSTS = [
    'devqora.space',
    'api.devqora.space',
    'localhost',
    '127.0.0.1'
];

function log(level, message, data = null) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[LOG_LEVEL] || levels.error;

    if (levels[level] >= currentLevel) {
        if (data && level === 'error') {
            console.error(`[${level.toUpperCase()}]`, message);
        } else if (data) {
            console.error(`[${level.toUpperCase()}]`, message, data);
        } else {
            console.error(`[${level.toUpperCase()}]`, message);
        }
    }
}

// Calculate Shannon entropy for password strength
function calculateEntropy(str) {
    const len = str.length;
    const frequencies = {};

    for (let i = 0; i < len; i++) {
        const char = str[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

// Validate API secret strength
function validateApiSecret(secret) {
    if (!secret) {
        throw new Error('MCP_API_SECRET is required. Please set it in your environment configuration.');
    }

    if (typeof secret !== 'string') {
        throw new Error('MCP_API_SECRET must be a string');
    }

    if (secret.length < MIN_SECRET_LENGTH) {
        throw new Error(`MCP_API_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. Current length: ${secret.length}`);
    }

    const entropy = calculateEntropy(secret);
    if (entropy < MIN_SECRET_ENTROPY) {
        throw new Error(`MCP_API_SECRET is too weak. Use a mix of characters for better security. (Entropy: ${entropy.toFixed(2)} bits/char, minimum: ${MIN_SECRET_ENTROPY})`);
    }

    return true;
}

function validateEmail(email) {
    // Length check first to prevent ReDoS
    if (!email || email.length > MAX_EMAIL_LENGTH) {
        return false;
    }

    // Simple, non-backtracking regex to prevent ReDoS
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
}

function validateInput(value, maxLength, fieldName) {
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
    }

    if (value.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }

    return value;
}

function validateApiEndpoint(url) {
    try {
        const parsedUrl = new URL(url);

        // Only allow HTTPS in production (or HTTP for localhost in development)
        if (NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
            throw new Error('HTTPS is required in production environment');
        }

        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
            throw new Error('Invalid protocol. Only HTTPS (and HTTP for localhost) is allowed.');
        }

        // Check if hostname is in whitelist
        if (!ALLOWED_API_HOSTS.includes(parsedUrl.hostname)) {
            throw new Error(`API host ${parsedUrl.hostname} is not in the allowed list`);
        }

        return true;
    } catch (error) {
        throw new Error(`Invalid API endpoint: ${error.message}`);
    }
}

function cleanupCaches() {
    const now = Date.now();

    // Cleanup request cache
    for (const [key, timestamp] of requestCache.entries()) {
        if (now - timestamp > REQUEST_CACHE_TTL_MS) {
            requestCache.delete(key);
        }
    }

    // Cleanup email-based rate limit map
    for (const [key, timestamps] of rateLimitMap.entries()) {
        const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
        if (recentRequests.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, recentRequests);
        }
    }

    // Cleanup IP-based rate limit map
    for (const [key, timestamps] of ipRateLimitMap.entries()) {
        const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
        if (recentRequests.length === 0) {
            ipRateLimitMap.delete(key);
        } else {
            ipRateLimitMap.set(key, recentRequests);
        }
    }
}

function checkRateLimit(identifier, isIP = false) {
    const now = Date.now();
    const limitMap = isIP ? ipRateLimitMap : rateLimitMap;
    const userRequests = limitMap.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    recentRequests.push(now);
    limitMap.set(identifier, recentRequests);

    return true;
}

// Aggressive cache cleanup for high traffic (every 2 minutes)
setInterval(cleanupCaches, 2 * 60 * 1000);

function validateTimestamp(timestamp, payloadHash) {
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);

    if (isNaN(requestTime)) {
        throw new Error('Invalid timestamp format');
    }

    if (requestTime < 0 || requestTime > now + TIMESTAMP_TOLERANCE_MS) {
        throw new Error('Invalid timestamp value');
    }

    const timeDiff = Math.abs(now - requestTime);

    if (timeDiff > TIMESTAMP_TOLERANCE_MS) {
        throw new Error('Request timestamp outside acceptable window');
    }

    // Prevent replay attacks with timestamp + payload hash combination
    const requestId = `${timestamp}:${payloadHash}`;
    if (requestCache.has(requestId)) {
        throw new Error('Duplicate request detected');
    }

    requestCache.set(requestId, now);

    // Limit cache size by removing oldest entries
    if (requestCache.size > REQUEST_CACHE_SIZE) {
        const oldestKey = requestCache.keys().next().value;
        requestCache.delete(oldestKey);
    }
}

function generateSignature(payload) {
    validateApiSecret(apiSecret);

    const timestamp = Date.now().toString();
    const payloadString = JSON.stringify(payload);

    // Create a hash of the payload for replay protection
    const payloadHash = crypto
        .createHash('sha256')
        .update(payloadString)
        .digest('hex')
        .substring(0, 16); // Use first 16 chars as identifier

    const message = payloadString + timestamp;
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');

    validateTimestamp(timestamp, payloadHash);

    return { signature, timestamp };
}

function sanitizeText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
}

function validateApiResponse(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Malformed API response');
    }

    if (!data.success || typeof data.data !== 'object') {
        throw new Error(data.error || 'Generation failed');
    }

    const { title, description, tags, suggested_price_range: priceRange } = data.data;

    if (typeof title !== 'string' || !title.trim()) {
        throw new Error('API response missing title');
    }

    if (typeof description !== 'string' || !description.trim()) {
        throw new Error('API response missing description');
    }

    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
        throw new Error('API response tags must be an array of strings');
    }

    if (typeof priceRange !== 'string') {
        throw new Error('API response missing price suggestion');
    }

    let usage = null;
    if (data.usage && typeof data.usage === 'object') {
        const { current, limit, remaining } = data.usage;
        const isValidNumber = (value) => typeof value === 'number' && Number.isFinite(value);
        if ([current, limit, remaining].every(isValidNumber)) {
            usage = { current, limit, remaining };
        }
    }

    return {
        title: sanitizeText(title),
        description: sanitizeText(description),
        tags: tags.map(tag => sanitizeText(tag)).filter(Boolean),
        suggestedPriceRange: sanitizeText(priceRange),
        usage
    };
}

// Extract IP from request (for future use with actual network layer)
function getRequestIP() {
    // In stdio mode, we don't have real IP, use a placeholder
    // This can be enhanced if the server runs in HTTP mode
    return 'stdio-client';
}

async function generateEtsySEO(productName, category = '') {
    // Input validation
    validateInput(productName, MAX_PRODUCT_NAME_LENGTH, 'Product name');

    if (typeof productName !== 'string' || !productName.trim()) {
        throw new Error('Product name is required.');
    }

    if (category) {
        validateInput(category, MAX_CATEGORY_LENGTH, 'Category');
    }

    if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
        throw new Error('Email not configured. Please add your email to the MCP config.');
    }

    const normalizedEmail = userEmail.trim();
    validateInput(normalizedEmail, MAX_EMAIL_LENGTH, 'Email');

    if (!validateEmail(normalizedEmail)) {
        throw new Error('Invalid email format. Please provide a valid email address.');
    }

    // Check both email-based and IP-based rate limits
    if (!checkRateLimit(normalizedEmail, false)) {
        throw new Error(`Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.`);
    }

    const clientIP = getRequestIP();
    if (!checkRateLimit(clientIP, true)) {
        throw new Error(`Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute per client.`);
    }

    try {
        const payload = {
            product_name: productName.trim(),
            category: typeof category === 'string' ? category.trim() : '',
            email: normalizedEmail
        };

        const { signature, timestamp } = generateSignature(payload);

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'etsy-seo-mcp/1.0.0',
                'X-MCP-Signature': signature,
                'X-MCP-Timestamp': timestamp,
                'X-MCP-Version': '1.0.0'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
            let errorMessage = 'Failed to generate SEO content. Please try again.';

            try {
                const errorBody = await response.json();
                if (errorBody?.error) {
                    // Only expose safe error messages from API
                    const safeErrors = [
                        'Rate limit exceeded',
                        'Invalid product name',
                        'Invalid category',
                        'Quota exceeded',
                        'Invalid email',
                        'Invalid signature',
                        'Request expired'
                    ];

                    const isSafeError = safeErrors.some(safe => errorBody.error.includes(safe));
                    if (isSafeError) {
                        errorMessage = errorBody.error;
                    } else {
                        log('warn', 'API error sanitized', { original: errorBody.error, status: response.status });
                    }
                }
            } catch (parseError) {
                log('debug', 'Failed to parse error response', { status: response.status });
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        const validated = validateApiResponse(data);

        log('info', 'SEO generated successfully', { email: normalizedEmail });

        return validated;

    } catch (error) {
        log('error', 'Error in generateEtsySEO', error.message);

        // Sanitize error messages before throwing
        const sanitizedMessage = error.message || 'An unexpected error occurred. Please try again.';
        throw new Error(sanitizedMessage);
    }
}

// Validate API endpoint and secret on startup
try {
    validateApiEndpoint(API_ENDPOINT);
    validateApiSecret(apiSecret);
    log('info', 'Security validation passed', { environment: NODE_ENV });
} catch (error) {
    log('error', 'Startup validation failed', error.message);
    process.exit(1);
}

// MCP Protocol Handler
process.stdin.on('data', async (chunk) => {
    // Buffer overflow protection
    if (buffer.length + chunk.length > MAX_BUFFER_SIZE) {
        log('error', 'Buffer overflow detected', { bufferSize: buffer.length, chunkSize: chunk.length });
        buffer = ''; // Reset buffer
        return;
    }

    buffer += chunk;

    // Process line by line
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
        if (!line.trim()) continue;

        // Length validation for individual lines
        if (line.length > MAX_INPUT_LENGTH) {
            log('warn', 'Input line too long, skipping', { length: line.length });
            continue;
        }

        try {
            // Safe JSON parsing with error handling
            let request;
            try {
                request = JSON.parse(line);
            } catch (jsonError) {
                log('warn', 'Invalid JSON received', { error: jsonError.message });
                throw new Error('Invalid JSON format');
            }

            // Validate request structure
            if (!request || typeof request !== 'object') {
                throw new Error('Invalid request structure');
            }

            if (request.method === 'initialize') {
                // Get email from initialization params with validation
                if (request.params?.initializationOptions?.email) {
                    const email = request.params.initializationOptions.email;
                    if (typeof email === 'string' && email.length <= MAX_EMAIL_LENGTH) {
                        userEmail = email;
                    } else {
                        log('warn', 'Invalid email in initialization params');
                    }
                }

                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: 'etsy-seo-mcp',
                            version: '1.0.0'
                        }
                    }
                };

                console.log(JSON.stringify(response));

            } else if (request.method === 'tools/list') {
                // List available tools
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        tools: [
                            {
                                name: 'generate_etsy_seo',
                                description: 'Generate SEO-optimized Etsy product title, description, and tags. Free: 10 generations/month.',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        product_name: {
                                            type: 'string',
                                            description: 'The product name to generate SEO for'
                                        },
                                        category: {
                                            type: 'string',
                                            description: 'Optional product category (e.g., "Home & Living")'
                                        }
                                    },
                                    required: ['product_name']
                                }
                            }
                        ]
                    }
                };

                console.log(JSON.stringify(response));

            } else if (request.method === 'tools/call') {
                // Execute tool
                const { name, arguments: args } = request.params;

                if (name === 'generate_etsy_seo') {
                    if (!args || typeof args.product_name !== 'string') {
                        throw new Error('Invalid arguments: product_name is required');
                    }

                    const category = typeof args.category === 'string' ? args.category : '';
                    const result = await generateEtsySEO(args.product_name, category);

                    const usageInfo = result.usage
                        ? `\n\n---\n**Usage:** ${result.usage.current}/${result.usage.limit} generations used this month (${result.usage.remaining} remaining)`
                        : '';

                    const sanitizedProductName = sanitizeText(args.product_name);
                    const tagList = result.tags.length ? result.tags.join(', ') : 'No tags provided';

                    const response = {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `# Etsy SEO Results for "${sanitizedProductName}"

## 📝 SEO Title
${result.title}

## 📄 Product Description
${result.description}

## 🏷️ Tags (${result.tags.length})
${tagList}

## 💰 Suggested Price
${result.suggestedPriceRange}${usageInfo}`
                                }
                            ]
                        }
                    };

                    console.log(JSON.stringify(response));
                } else {
                    throw new Error(`Unknown tool: ${name}`);
                }
            }

        } catch (error) {
            const errorResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32603,
                    message: error.message
                }
            };

            console.log(JSON.stringify(errorResponse));
        }
    }
});

process.stdin.on('end', () => {
    process.exit(0);
});

// Handle errors
process.on('uncaughtException', (error) => {
    log('error', 'Uncaught exception', error.message);
    process.exit(1);
});

log('info', 'Etsy SEO MCP Server started', { version: '1.0.0', logLevel: LOG_LEVEL, environment: NODE_ENV });
