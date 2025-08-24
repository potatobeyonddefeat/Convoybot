## Convoy (Discord Bot)

A social-navigation moderation and security bot for the Convoy Discord server. Built with Node.js and discord.js v14.

### Features
- **Moderation**: `/ban`, `/kick`, `/timeout`, `/purge`, `/slowmode`, `channel lock|unlock`
- **Security**: Anti-spam, bad-words filter, link restrictions, mention limits
- **Presence**: Shows "Convoys and Cruises"

### Requirements
- Node.js 18+
- A Discord application and bot token

### Setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` from example and fill in values:
```bash
cp .env.example .env
# Edit .env and set DISCORD_TOKEN, CLIENT_ID, optional GUILD_ID
```
- **DISCORD_TOKEN**: Your bot token
- **CLIENT_ID**: Your application (bot) client ID
- **GUILD_ID**: Optional; if set, commands register instantly to that server

3. Deploy slash commands:
```bash
npm run deploy:commands
```

4. Run the bot:
```bash
npm run start
```

### Commands
- `/ban user:<user> reason?:<text>`
- `/kick user:<user> reason?:<text>`
- `/timeout user:<user> minutes:<1-40320> reason?:<text>`
- `/purge count:<1-100> channel?:<#channel>`
- `/slowmode seconds:<0-21600> channel?:<#channel>`
- `/channel lock channel?:<#channel>`
- `/channel unlock channel?:<#channel>`

### Security Filters
Configured in `src/config.js`:
- **antiSpam**: rate-limits messages, applies timeout on flood
- **badWords**: deletes and warns on matched words
- **links**: allows only whitelisted domains; blocks invite links if enabled
- **mentions**: enforces a per-message mention limit

### Development Tips
- Use a test server and set `GUILD_ID` for faster command registration
- Update `src/config.js` to tune moderation/security settings

### License
ISC
