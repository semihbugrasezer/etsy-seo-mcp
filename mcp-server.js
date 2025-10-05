#!/usr/bin/env node

/**
 * Etsy SEO MCP Server
 * Model Context Protocol server for Claude Desktop integration
 */

// Simple MCP stdio communication
process.stdin.setEncoding('utf8');

let buffer = '';
let userEmail = process.env.EMAIL || null;

// API endpoint (obfuscated)
const API_BASE = 'https://devqora.space';
const API_PATH = '/api/generate';
const API_ENDPOINT = API_BASE + API_PATH;

// Simple request signature to prevent direct API abuse
function generateSignature(payload) {
    const timestamp = Date.now();
    const data = JSON.stringify(payload) + timestamp;
    // Simple hash - backend will validate
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return { signature: Math.abs(hash).toString(36), timestamp };
}

async function generateEtsySEO(productName, category = '') {
    if (!userEmail) {
        throw new Error('Email not configured. Please add your email to the MCP config.');
    }

    try {
        const payload = {
            product_name: productName,
            category: category || '',
            email: userEmail
        };

        const { signature, timestamp } = generateSignature(payload);

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'etsy-seo-mcp/1.0.0',
                'X-MCP-Signature': signature,
                'X-MCP-Timestamp': timestamp.toString(),
                'X-MCP-Version': '1.0.0'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to generate content');
        }

        return {
            ...data.data,
            usage: data.usage
        };

    } catch (error) {
        console.error('Error generating SEO:', error);
        throw new Error(error.message || 'Failed to generate Etsy SEO content');
    }
}

// MCP Protocol Handler
process.stdin.on('data', async (chunk) => {
    buffer += chunk;

    // Process line by line
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
        if (!line.trim()) continue;

        try {
            const request = JSON.parse(line);

            if (request.method === 'initialize') {
                // Get email from initialization params
                if (request.params?.initializationOptions?.email) {
                    userEmail = request.params.initializationOptions.email;
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
                    const result = await generateEtsySEO(
                        args.product_name,
                        args.category || ''
                    );

                    const usageInfo = result.usage
                        ? `\n\n---\n**Usage:** ${result.usage.current}/${result.usage.limit} generations used this month (${result.usage.remaining} remaining)`
                        : '';

                    const response = {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `# Etsy SEO Results for "${args.product_name}"

## 📝 SEO Title
${result.title}

## 📄 Product Description
${result.description}

## 🏷️ Tags (13)
${result.tags.join(', ')}

## 💰 Suggested Price
${result.suggested_price_range}${usageInfo}`
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
    console.error('Uncaught exception:', error);
    process.exit(1);
});

console.error('Etsy SEO MCP Server started');
