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
			censor: true,
			maskChar: '*',
			repostCensored: true,
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
			action: 'ban', // timeout|kick|ban (default: ban)
			timeoutMinutes: 60,
			massJoin: {
				enabled: true,
				threshold: 5,
				windowMs: 60000,
				lockdownMinutes: 10,
				lockChannels: ['general'],
			},
		},
	},
	welcome: {
		enabled: true,
		channelId: null,
		template: 'Welcome {user} to {server}! Check out {rules} and introduce yourself in {introductions}.',
		placeholders: {
			rules: '#rules',
			introductions: '#introductions',
		},
	},
	appeals: {
		enabled: true,
		reviewChannelId: null,
		form: {
			title: 'Ban Appeal',
			fields: ['Why should we lift your ban?', 'What happened?', 'Anything else we should know?'],
		},
	},
	invites: {
		preferredChannelId: process.env.INVITE_CHANNEL_ID || null,
	},
	memberCount: {
		enabled: true,
		categoryName: '📊 Server Stats',
		format: {
			total: 'All members: {total}',
			members: 'Members: {members}',
			bots: 'Bots: {bots}',
		},
		ids: { categoryId: null, totalId: null, membersId: null, botsId: null },
	},
	logging: { level: 'info' },
	audit: {
		enabled: true,
		channelId: process.env.AUDIT_CHANNEL_ID || null,
		fileEnabled: true,
		filePath: 'logs/audit.log',
	},
	notifier: {
		adminUserId: process.env.ADMIN_USER_ID || '1249576473740841058',
		dmOnModeration: true,
		dmOnFilter: true,
		adminNotifyOnError: true,
	},
};
