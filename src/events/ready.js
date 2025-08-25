module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		client.logger.info(`Logged in as ${client.user.tag}`);
		client.user.setPresence({ activities: [{ name: 'Convoys and Cruises' }], status: 'online' });
		// Kick off member count update shortly after ready
		setTimeout(async () => {
			try {
				const cfg = client.config.memberCount;
				if (!cfg?.enabled) return;
				const { ensureCategoryAndChannels, updateNames } = require('../utils/memberCount');
				for (const [, guild] of client.guilds.cache) {
					const result = await ensureCategoryAndChannels(guild, cfg);
					client.config.memberCount.ids = result.ids;
					await updateNames(guild, client.config.memberCount);
				}
			} catch (e) {
				client.logger.error('MemberCount init failed', e);
			}
		}, 3000).unref?.();
	},
};
