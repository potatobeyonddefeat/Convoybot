const fs = require('fs');
const path = require('path');

async function loadEvents(client) {
	const eventsDir = path.join(process.cwd(), 'src', 'events');
	if (!fs.existsSync(eventsDir)) {
		client.logger.warn('Events directory not found, skipping.');
		return;
	}

	const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'));
	for (const file of files) {
		const filePath = path.join(eventsDir, file);
		try {
			const event = require(filePath);
			if (!event?.name || typeof event.execute !== 'function') {
				client.logger.warn(`Invalid event file skipped: ${filePath}`);
				continue;
			}
			if (event.once) {
				client.once(event.name, (...args) => event.execute(client, ...args));
			} else {
				client.on(event.name, (...args) => event.execute(client, ...args));
			}
			client.logger.info(`Loaded event: ${event.name}`);
		} catch (err) {
			client.logger.error(`Failed loading event: ${filePath}`, err);
		}
	}
}

module.exports = { loadEvents };
