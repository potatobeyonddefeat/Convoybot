const { PermissionFlagsBits, ChannelType } = require('discord.js');

const joinBuckets = new Map(); // guildId -> timestamps[]

function recordJoin(guildId, windowMs) {
	const now = Date.now();
	const arr = joinBuckets.get(guildId) || [];
	const pruned = arr.filter((t) => now - t < windowMs);
	pruned.push(now);
	joinBuckets.set(guildId, pruned);
	return pruned.length;
}

async function applyLockdown(client, guild) {
	const cfg = client.config.security.raidMode.massJoin;
	const channels = cfg.lockChannels || [];
	for (const name of channels) {
		const channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === name);
		if (!channel) continue;
		const everyone = guild.roles.everyone;
		try {
			await channel.permissionOverwrites.edit(everyone, { SendMessages: false }, { reason: 'Raid lockdown' });
			client.audit.log({ command: 'raid.lockdown', actorId: 'system', actorTag: 'system', channel: channel.name });
		} catch {}
	}
}

async function removeLockdown(client, guild) {
	const cfg = client.config.security.raidMode.massJoin;
	const channels = cfg.lockChannels || [];
	for (const name of channels) {
		const channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === name);
		if (!channel) continue;
		const everyone = guild.roles.everyone;
		try {
			await channel.permissionOverwrites.edit(everyone, { SendMessages: null }, { reason: 'Raid lockdown ended' });
			client.audit.log({ command: 'raid.unlock', actorId: 'system', actorTag: 'system', channel: channel.name });
		} catch {}
	}
}

async function sendWelcome(client, member) {
	const w = client.config.welcome;
	if (!w?.enabled || !w.channelId) return;
	const channel = member.guild.channels.cache.get(w.channelId) || await member.guild.channels.fetch(w.channelId).catch(() => null);
	if (!channel || channel.type !== ChannelType.GuildText) return;
	const { render } = require('../utils/template');
	const text = render(w.template, { user: `<@${member.id}>`, server: member.guild.name, ...(w.placeholders || {}) });
	await channel.send({ content: text }).catch(() => {});
}

module.exports = {
	name: 'guildMemberAdd',
	once: false,
	execute: async (client, member) => {
		// Raid prevention first
		const cfg = client.config.security?.raidMode;
		let flagged = false;
		if (cfg?.enabled) {
			// Account age check
			const createdAt = member.user.createdAt;
			const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
			if (cfg.newAccountAgeDays && ageDays < cfg.newAccountAgeDays) {
				try {
					flagged = true;
					if (cfg.action === 'ban') await member.ban({ reason: 'Raid prevention: new account' });
					else if (cfg.action === 'kick') await member.kick('Raid prevention: new account');
					else {
						const ms = (cfg.timeoutMinutes || 60) * 60 * 1000;
						await member.timeout(ms, 'Raid prevention: new account');
					}
					client.audit.log({ command: 'raid.account-age', actorId: 'system', actorTag: 'system', target: `${member.user.tag} (${member.id})` });
				} catch {}
			}

			// Mass join detection
			if (cfg.massJoin?.enabled) {
				const joins = recordJoin(member.guild.id, cfg.massJoin.windowMs || 60000);
				if (joins >= (cfg.massJoin.threshold || 5)) {
					applyLockdown(client, member.guild);
					const endInMs = (cfg.massJoin.lockdownMinutes || 10) * 60 * 1000;
					setTimeout(() => removeLockdown(client, member.guild), endInMs).unref?.();
				}
			}
		}

		// Welcome only if not flagged by age check
		if (!flagged) {
			sendWelcome(client, member);
		}
	},
};
