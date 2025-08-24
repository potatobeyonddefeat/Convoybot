const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const config = require('./config');
const { loadCommands } = require('./handlers/commandLoader');
const { loadEvents } = require('./handlers/eventLoader');
const { createLogger } = require('./utils/logger');

const logger = createLogger(config.logging?.level || 'info');

// Create client with intents needed for moderation and content filtering
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
	],
	partials: [Partials.Channel, Partials.Message, Partials.User, Partials.Reaction],
});

client.commands = new Collection();
client.config = config;
client.logger = logger;

(async () => {
	try {
		await loadCommands(client);
		await loadEvents(client);

		const token = process.env.DISCORD_TOKEN;
		if (!token) {
			logger.error('Missing DISCORD_TOKEN in environment.');
			process.exit(1);
		}

		await client.login(token);
		logger.info('Convoy bot logging in...');
	} catch (error) {
		logger.error('Failed to start Convoy bot', error);
		process.exit(1);
	}
})();

process.on('SIGINT', async () => {
	logger.info('Shutting down Convoy bot...');
	try { await client.destroy(); } catch {}
	process.exit(0);
});
