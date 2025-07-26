
# **RainbowUtilities**
## Version 1.3.0

**RainbowUtilities** is a versatile Discord bot designed to enhance server moderation, engagement, and automation. With a suite of powerful tools, this bot helps keep your community safe, interactive, and well-organized.

---

## 🚀 Features

- **Announce Command** – Easily send important announcements to server channels.
- **Moderation Tools**:
  - `/ban` – Permanently remove a user from the server.
  - `/kick` – Temporarily remove a user.
  - `/mute` – Temporarily silence a user.
  - `/timeout`, `/warn`, `/unmute`, etc.
- **Purge Command** – Bulk-delete messages from a channel.
- **Poll Command** – Create interactive polls for members to vote on.
- **Settings Command** – Configure the bot behavior directly from Discord.
- **Setup Command** – Quickly initialize bot settings for your server (log channel, mute role, etc.).
- **Automod** – Automatically detects and handles spam, excessive caps, and more.
- **DM Sessions** – Enables private DM threads between users and staff. (Under development)
- **AI Chat** – Uses Google Gemini to answer user questions via `/ai`.
- **GIF Search** – Uses Tenor API to send trending or topic-specific GIFs.

---

## ⚙️ Setup

### 1. Clone the Repository
If applicable:

```bash
git clone https://github.com/yourusername/rainbowutilities.git
cd rainbowutilities
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the project:

```env
DISCORD_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_discord_client_id
GEMINI_API_KEY=your_google_gemini_api_key
TENOR_API_KEY=your_tenor_api_key
```

**Never share this file. It’s private and is excluded by `.gitignore`.**

#### 🔑 How to Get API Keys

##### ▸ **Google Gemini API Key**
1. Go to: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account.
3. Click **"Create API key"**.
4. Copy the key and paste it into `.env` as `GEMINI_API_KEY`.

##### ▸ **Tenor API Key**
1. Go to: [https://tenor.com/gifapi](https://tenor.com/gifapi)
2. Click **"Get a Key"**.
3. Sign in and create a new app.
4. Use the provided key in your `.env` as `TENOR_API_KEY`.

### 4. Configuration Files

Ensure you have the following files in a `data/` folder:

#### `data/config.json` – Default settings

```json
{
  "defaultSettings": {
    "moderatorRoles": [],
    "logChannel": null,
    "muteRole": null,
    "autoMod": {
      "enabled": true,
      "spamThreshold": 5,
      "timeWindow": 10000,
      "capsThreshold": 0.8,
      "maxMentions": 3
    },
    "warningActions": {
      "3": "timeout_1h",
      "5": "timeout_24h",
      "7": "ban"
    }
  }
}
```

#### `data/serverConfig.json` – Per-server config

This file is generated automatically on first run. Example:

```json
{
  "guilds": {}
}
```

---

### 5. Run the Bot

#### Production:

```bash
npm start
```

#### Development (if you use nodemon):

```bash
npm run dev
```

---

## 💡 Usage

Once invited to your Discord server and running, use slash commands:

- `/setup` – Start configuration for your server.
- `/poll`, `/mute`, `/announce`, `/ai`, etc.

---

## ✅ Final Notes

- Keep your `.env` and `config.json` files private.
- Never delete `.gitignore` – it protects your secrets!
- Make sure your bot’s role is **above** any users you want to moderate.
- Test all features in a safe environment before using on a live server.

---

> Built with ❤️ by the RainbowUtilities team.
