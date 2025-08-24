const { PermissionFlagsBits, ChannelType } = require('discord.js');

function getMissingPermissions(member, channel, required) {
	const perms = channel ? member.permissionsIn(channel) : member.permissions;
	return required.filter((p) => !perms.has(p));
}

function ensureBotGuildPermissions(interaction, required) {
	const me = interaction.guild?.members?.me;
	if (!me) return { ok: false, message: 'Bot member not found in guild.' };
	const missing = getMissingPermissions(me, null, required);
	if (missing.length) {
		return { ok: false, message: `I am missing guild permissions: ${missing.map(fmtPerm).join(', ')}` };
	}
	return { ok: true };
}

function ensureBotChannelPermissions(interaction, channel, required) {
	const me = interaction.guild?.members?.me;
	if (!me) return { ok: false, message: 'Bot member not found in guild.' };
	const missing = getMissingPermissions(me, channel, required);
	if (missing.length) {
		return { ok: false, message: `I am missing permissions in ${channel}: ${missing.map(fmtPerm).join(', ')}` };
	}
	return { ok: true };
}

function fmtPerm(bit) {
	for (const [name, value] of Object.entries(PermissionFlagsBits)) {
		if (value === bit) return name;
	}
	return String(bit);
}

function isTextChannel(channel) {
	return channel && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement || channel.isThread?.());
}

function isRoleHierarchyHigher(actorMember, targetMember) {
	if (!actorMember || !targetMember) return true;
	return actorMember.roles.highest.comparePositionTo(targetMember.roles.highest) > 0;
}

module.exports = {
	ensureBotGuildPermissions,
	ensureBotChannelPermissions,
	isTextChannel,
	isRoleHierarchyHigher,
	fmtPerm,
	getMissingPermissions,
};
