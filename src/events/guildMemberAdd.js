const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { dmUser } = require('../utils/notifier');
const { createOneTimeInvite } = require('../utils/invite');

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
					const action = cfg.action || 'ban';
					if (action === 'ban') {
						await member.ban({ reason: 'Raid prevention: new account' });
						dmUser(client, member.id, `You were banned from ${member.guild.name} due to account age checks for raid prevention. You may appeal via /appeal in DMs.`).catch(() => {});
					} else if (action === 'kick') {
						await member.kick('Raid prevention: new account');
						let inviteUrl = '';
						try {
							const { url } = await createOneTimeInvite(member.guild, client.config.invites?.preferredChannelId, 'Appeal reinvite (kick)');
							inviteUrl = url;
						} catch {}
						dmUser(client, member.id, `You were kicked from ${member.guild.name} due to account age checks for raid prevention. If you believe this is a mistake, use this 24h one-time invite to rejoin and contact staff: ${inviteUrl || 'Invite unavailable'}`).catch(() => {});
					} else {
						const ms = (cfg.timeoutMinutes || 60) * 60 * 1000;
						await member.timeout(ms, 'Raid prevention: new account');
						let inviteUrl = '';
						try {
							const { url } = await createOneTimeInvite(member.guild, client.config.invites?.preferredChannelId, 'Appeal reinvite (timeout)');
							inviteUrl = url;
						} catch {}
						dmUser(client, member.id, `You were temporarily restricted in ${member.guild.name} due to account age checks. You can use this 24h one-time invite if you get disconnected: ${inviteUrl || 'Invite unavailable'}`).catch(() => {});
					}
					client.audit.log({ command: 'raid.account-age', actorId: 'system', actorTag: 'system', target: `${member.user.tag} (${member.id})`, reason: `age ${ageDays.toFixed(2)}d < ${cfg.newAccountAgeDays}d`, action });
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
