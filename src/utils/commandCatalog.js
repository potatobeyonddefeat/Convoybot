const { PermissionFlagsBits } = require('discord.js');

function getCatalog() {
	return {
		moderation: [
			{ name: 'ban', usage: '/ban user reason?', desc: 'Ban a member from the server.', userPerms: [PermissionFlagsBits.BanMembers], botPerms: [PermissionFlagsBits.BanMembers], details: 'Bans the target member. The bot DMs the user (if possible) and records an audit entry.' },
			{ name: 'kick', usage: '/kick user reason?', desc: 'Kick a member from the server.', userPerms: [PermissionFlagsBits.KickMembers], botPerms: [PermissionFlagsBits.KickMembers], details: 'Kicks the target member and records an audit entry.' },
			{ name: 'timeout', usage: '/timeout user minutes reason?', desc: 'Timeout a member for a duration.', userPerms: [PermissionFlagsBits.ModerateMembers], botPerms: [PermissionFlagsBits.ModerateMembers], details: 'Places the user in timeout for the specified minutes and records an audit entry.' },
			{ name: 'purge', usage: '/purge count channel?', desc: 'Bulk delete 1–100 recent messages.', userPerms: [PermissionFlagsBits.ManageMessages], botPerms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory], details: 'Deletes recent messages (cannot delete older than 14 days). Records an audit entry with deleted count.' },
			{ name: 'slowmode', usage: '/slowmode seconds channel?', desc: 'Set channel slowmode.', userPerms: [PermissionFlagsBits.ManageChannels], botPerms: [PermissionFlagsBits.ManageChannels], details: 'Sets the per-user rate limit for a channel and records an audit entry.' },
			{ name: 'channel', usage: '/channel lock|unlock channel?', desc: 'Lock or unlock a text channel.', userPerms: [PermissionFlagsBits.ManageChannels], botPerms: [PermissionFlagsBits.ManageChannels], details: 'Toggles Send Messages for @everyone in the channel and records an audit entry.' },
			{ name: 'role', usage: '/role add|remove user role reason?', desc: 'Give or remove roles from members.', userPerms: [PermissionFlagsBits.ManageRoles], botPerms: [PermissionFlagsBits.ManageRoles], details: 'Respects role hierarchy: your and the bot’s highest roles must be above the target role.' },
		],
		admin: [
			{ name: 'security', usage: '/security ...', desc: 'View and configure security settings.', userPerms: [PermissionFlagsBits.Administrator], botPerms: [], details: 'Use subcommands to enable/disable security, configure anti-spam, bad-words, and raid protection. Settings persist to data/security.json.' },
		],
		security: [
			{ name: 'filters', usage: 'Automatic', desc: 'Anti-spam, bad-words, link restrictions, mention limits, raid checks.', userPerms: [], botPerms: [], details: 'Security features run automatically and are configurable with /security.' },
		],
		securityTopics: [
			{ key: 'antispam', label: 'Anti-spam', desc: 'Rate-limit rapid messages and auto-timeout offenders.', details: 'Tracks per-user message bursts within a window. If messages exceed the threshold, the user is timed out. Configure with /security antispam set window_ms:<ms> max:<n> timeout_seconds:<s>.' },
			{ key: 'badwords', label: 'Bad-words filter', desc: 'Delete and optionally repost censored messages.', details: 'Matches configured words case-insensitively. Deletes and can repost a censored version. Manage list with /security badwords add/remove and toggle repost with /security badwords toggle_censor.' },
			{ key: 'links', label: 'Links policy', desc: 'Block non-whitelisted links and invite links.', details: 'URLs not ending with allowed domains are removed; Discord invites are blocked when enabled. Adjust allowed domains in config or extend to a command if needed.' },
			{ key: 'mentions', label: 'Mentions limit', desc: 'Prevent mass-mention abuse.', details: 'Deletes messages exceeding the mentions limit (users + roles + everyone). Configure max with /security (add toggle if needed).' },
			{ key: 'raid', label: 'Raid prevention', desc: 'Account-age checks and mass-join lockdown.', details: 'New accounts under the minimum age receive timeout/kick/ban. Mass-join triggers temporary channel lockdown. Configure with /security raid age and /security raid massjoin.' },
		],
	};
}

module.exports = { getCatalog };
