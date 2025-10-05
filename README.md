# 🚀 Etsy SEO Generator

<div align="center">

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/semihbugrasezer/etsy-seo-mcp?style=social)](https://github.com/semihbugrasezer/etsy-seo-mcp)

**AI-powered Etsy product listing generator for Claude Desktop**

Generate perfect SEO titles, descriptions, and tags in seconds

[Live Demo](https://devqora.space) • [Quick Start](#-quick-start) • [Examples](#-examples)

</div>

---

## 🎯 What is this?

A Claude Desktop integration that generates complete, SEO-optimized Etsy product listings instantly. Perfect for Etsy sellers who want to:

- ✅ Save 3+ hours per product listing
- ✅ Rank higher in Etsy search results
- ✅ Write compelling product descriptions
- ✅ Never run out of creative tag ideas

## ⚡ Quick Start

### 1. Install in Claude Desktop

Add this to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "etsy-seo": {
      "command": "npx",
      "args": ["-y", "@devqora/etsy-seo-mcp"],
      "env": {
        "EMAIL": "your-email@example.com",
        "MCP_API_SECRET": "your-shared-secret"
      }
    }
  }
}
```

**Important:** Replace `your-email@example.com` with your email address for usage tracking and `your-shared-secret` with the API secret provided from your DevQora dashboard. The secret is used to create an HMAC signature for every request.

### 2. Restart Claude Desktop

Close and reopen Claude Desktop completely.

### 3. Start Using

That's it! Just ask Claude:

```
Generate an Etsy listing for my handmade ceramic coffee mug
```

**Free Tier:** 10 generations per month
**Premium:** Unlimited generations - [Upgrade at devqora.space](https://devqora.space)

---

## 💬 Examples

### Simple Request
```
Create Etsy SEO for "vintage leather journal"
```

### With Category
```
Generate an Etsy listing for handmade candles in the Home & Living category
```

### With Details
```
I'm selling boho macrame wall hangings.
Create an optimized Etsy listing with title, description, and tags.
```

---

## 📦 What You Get

Each generation includes:

### 📝 SEO Title
- Under 140 characters (Etsy requirement)
- Primary keywords included
- Compelling and click-worthy

### 📄 Product Description
- Engaging opening hook
- Key features and benefits
- Usage scenarios
- Call-to-action

### 🏷️ 13 Optimized Tags
- Mix of broad and specific keywords
- Etsy search-optimized
- Trending search terms included

### 💰 Price Suggestion
- Based on similar Etsy products
- Market competitive range

---

## 🔐 Security

This MCP server implements **enterprise-grade security** with comprehensive protection against common vulnerabilities:

### 🛡️ Cryptographic Security
- **HMAC-SHA256 Signatures**: All requests cryptographically signed with secret key
- **Payload-Based Replay Protection**: Timestamp + payload hash prevents duplicate requests
- **Timestamp Validation**: 5-minute window prevents time-based attacks
- **Duplicate Request Detection**: Request cache blocks replay attempts

### 🚫 Input Validation & DoS Protection
- **Buffer Overflow Protection**: 1MB max buffer size prevents memory exhaustion
- **Input Length Limits**: Enforced max lengths for all user inputs
  - Product name: 500 chars
  - Category: 200 chars
  - Email: 254 chars (RFC 5321)
- **ReDoS Prevention**: Non-backtracking regex patterns prevent regex DoS
- **JSON Injection Protection**: Safe parsing with structure validation
- **Rate Limiting**: 10 requests/minute per user

### 🌐 Network Security
- **SSRF Protection**: Whitelist-based API endpoint validation
- **Protocol Enforcement**: HTTPS required (HTTP only for localhost)
- **Request Timeout**: 30-second timeout prevents hanging connections
- **Allowed Hosts**:
  - `devqora.space`
  - `api.devqora.space`
  - `localhost` (development only)

### 🧹 Data Sanitization
- **XSS Prevention**: HTML entity encoding for all outputs
- **Email Validation**: RFC-compliant format validation
- **Response Validation**: Strict schema validation of API responses
- **Safe Error Messages**: Error messages sanitized to prevent info disclosure

### 📊 Resource Management
- **Memory Leak Prevention**: Automatic cache cleanup every 5 minutes
- **Cache Size Limits**: Bounded cache sizes prevent memory exhaustion
- **Rate Limit Cleanup**: Automatic removal of expired rate limit entries

### 🔧 Environment Variables
- `MCP_API_SECRET`: **Required** - Your API secret for request signing
- `EMAIL`: **Required** - Your email for usage tracking
- `API_BASE`: Optional - API endpoint (must be in whitelist)
- `API_PATH`: Optional - API path (default: /api/generate)
- `LOG_LEVEL`: Optional - Logging level: debug/info/warn/error (default: error)

---

## 🌐 Web Interface

Prefer not to use Claude Desktop? Try our web interface:

👉 **[devqora.space](https://devqora.space)**

- Live demo
- Instant results
- No installation needed

---

## 🎨 Sample Output

**Input:** "Handmade ceramic coffee mug"

**Output:**

```markdown
📝 TITLE
Handmade Ceramic Coffee Mug | Artisan Pottery | Unique Kitchen Gift | Microwave Safe

📄 DESCRIPTION
Elevate your morning coffee ritual with this beautifully handcrafted ceramic mug.
Each piece is lovingly made by skilled artisans, ensuring no two mugs are exactly alike.

The perfect addition to your kitchen collection or a thoughtful gift for coffee
lovers. Featuring a comfortable ergonomic handle and smooth glazed finish.

✨ Features:
• Handmade with premium ceramic
• Microwave and dishwasher safe
• 12oz capacity
• Unique one-of-a-kind design

Perfect for daily use or special occasions. Makes an excellent housewarming or
birthday gift.

🏷️ TAGS
handmade mug, ceramic coffee cup, pottery mug, artisan mug, unique gift,
coffee lover gift, handcrafted, kitchen decor, tea cup, housewarming gift,
birthday present, ceramic pottery, handmade gift

💰 SUGGESTED PRICE
$28-$45
```

---

## 🤝 Support

- 💬 [GitHub Issues](https://github.com/semihbugrasezer/etsy-seo-mcp/issues)
- 📧 [support@devqora.space](mailto:support@devqora.space)
- 🌐 [devqora.space](https://devqora.space)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for Etsy sellers by [DevQora](https://devqora.space)**

[⭐ Star on GitHub](https://github.com/semihbugrasezer/etsy-seo-mcp) • [🚀 Try Now](https://devqora.space)

</div>
