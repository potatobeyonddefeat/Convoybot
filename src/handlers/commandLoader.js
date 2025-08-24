const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
	const commandsDir = path.join(process.cwd(), 'src', 'commands');
	if (!fs.existsSync(commandsDir)) {
		client.logger.warn('Commands directory not found, skipping.');
		return;
	}

	const folders = fs.readdirSync(commandsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
	for (const folder of folders) {
		const folderPath = path.join(commandsDir, folder.name);
		const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'));
		for (const file of files) {
			const filePath = path.join(folderPath, file);
			try {
				const command = require(filePath);
				if (command?.data && typeof command.execute === 'function') {
					client.commands.set(command.data.name, command);
					client.logger.info(`Registered command: ${command.data.name}`);
				} else {
					client.logger.warn(`Invalid command file skipped: ${filePath}`);
				}
			} catch (err) {
				client.logger.error(`Failed loading command: ${filePath}`, err);
			}
		}
	}
}

module.exports = { loadCommands };
