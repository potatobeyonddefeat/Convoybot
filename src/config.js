module.exports = {
	botName: 'Convoy',
	security: {
		enabled: true,
		antiSpam: {
			enabled: true,
			windowMs: 7000,
			max: 5,
			timeoutSeconds: 300,
		},
		badWords: {
			enabled: true,
			list: ['badword1', 'badword2'],
			delete: true,
			warn: true,
		},
		links: {
			enabled: true,
			allowDomainList: ['discord.com', 'discord.gg', 'youtube.com', 'youtu.be'],
			blockInvites: true,
		},
		mentions: {
			enabled: true,
			maxMentions: 5,
		},
		raidMode: {
			enabled: false,
			newAccountAgeDays: 1,
			restrictNewMembers: true,
		},
	},
	logging: { level: 'info' },
	audit: {
		enabled: true,
		channelId: process.env.AUDIT_CHANNEL_ID || null,
		// Fallback to file logging if no channel
		fileEnabled: true,
		filePath: 'logs/audit.log',
	},
};
