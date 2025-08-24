const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

async function collectCommands() {
	const commands = [];
	const commandsPath = path.join(process.cwd(), 'src', 'commands');
	if (!fs.existsSync(commandsPath)) return commands;

	const folders = fs.readdirSync(commandsPath, { withFileTypes: true }).filter((d) => d.isDirectory());
	for (const folder of folders) {
		const folderPath = path.join(commandsPath, folder.name);
		const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'));
		for (const file of files) {
			const command = require(path.join(folderPath, file));
			if (command?.data && typeof command.data.toJSON === 'function') {
				commands.push(command.data.toJSON());
			}
		}
	}
	return commands;
}

(async () => {
	const token = process.env.DISCORD_TOKEN;
	const clientId = process.env.CLIENT_ID;
	const guildId = process.env.GUILD_ID;
	if (!token || !clientId) {
		console.error('Missing DISCORD_TOKEN or CLIENT_ID');
		process.exit(1);
	}

	const rest = new REST({ version: '10' }).setToken(token);
	const commands = await collectCommands();

	try {
		if (guildId) {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
			console.log(`Registered ${commands.length} guild commands to ${guildId}`);
		} else {
			await rest.put(Routes.applicationCommands(clientId), { body: commands });
			console.log(`Registered ${commands.length} global commands`);
		}
	} catch (error) {
		console.error('Failed to deploy commands', error);
		process.exit(1);
	}
})();
