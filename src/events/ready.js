module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		client.logger.info(`Logged in as ${client.user.tag}`);
		client.user.setPresence({ activities: [{ name: 'Convoys and Cruises' }], status: 'online' });
	},
};
