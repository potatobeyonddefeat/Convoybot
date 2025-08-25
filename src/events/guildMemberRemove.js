const { updateNames } = require('../utils/memberCount');

module.exports = {
	name: 'guildMemberRemove',
	once: false,
	execute: async (client, member) => {
		try {
			const mc = client.config.memberCount;
			if (mc?.enabled) {
				await updateNames(member.guild, mc);
			}
		} catch {}
	},
};
