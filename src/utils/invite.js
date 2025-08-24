const { ChannelType, PermissionFlagsBits } = require('discord.js');

async function pickInviteChannel(guild, preferredChannelId) {
	const prefer = preferredChannelId || guild.systemChannelId;
	if (prefer) {
		const ch = guild.channels.cache.get(prefer) || await guild.channels.fetch(prefer).catch(() => null);
		if (ch && ch.type === ChannelType.GuildText) return ch;
	}
	// fallback: first text channel with CreateInstantInvite
	for (const [, ch] of guild.channels.cache) {
		if (ch.type !== ChannelType.GuildText) continue;
		const me = guild.members.me;
		if (!me) continue;
		if (ch.permissionsFor(me)?.has(PermissionFlagsBits.CreateInstantInvite)) return ch;
	}
	return null;
}

async function createOneTimeInvite(guild, preferredChannelId, reason = 'Convoy: temporary invite') {
	const channel = await pickInviteChannel(guild, preferredChannelId);
	if (!channel) throw new Error('No channel available to create invite');
	const create = channel.invites?.create?.bind(channel.invites) || channel.createInvite?.bind(channel);
	if (!create) throw new Error('Cannot create invites in this channel');
	const invite = await create({ maxAge: 86400, maxUses: 1, unique: true, reason });
	const url = invite.url || `https://discord.gg/${invite.code}`;
	return { invite, url, channelId: channel.id };
}

module.exports = { createOneTimeInvite };
