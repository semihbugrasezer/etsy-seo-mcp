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
        "EMAIL": "your-email@example.com"
      }
    }
  }
}
```

**Important:** Replace `your-email@example.com` with your email address for usage tracking.

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
