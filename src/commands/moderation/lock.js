const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ensureBotChannelPermissions } = require('../../utils/permissions');

async function setLock(interaction, shouldLock) {
	const channel = interaction.options.getChannel('channel') || interaction.channel;
	if (channel.type !== ChannelType.GuildText) return interaction.reply({ content: 'Only text channels are supported.', ephemeral: true });

	const permCheck = ensureBotChannelPermissions(interaction, channel, [PermissionFlagsBits.ManageChannels]);
	if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });

	await interaction.deferReply({ ephemeral: true });
	try {
		const everyone = interaction.guild.roles.everyone;
		await channel.permissionOverwrites.edit(everyone, { SendMessages: shouldLock ? false : null }, { reason: shouldLock ? 'Channel locked via command' : 'Channel unlocked via command' });
		await interaction.editReply(`${shouldLock ? 'Locked' : 'Unlocked'} ${channel}.`);
	} catch (err) {
		interaction.client?.logger?.error?.('Failed to update channel lock', err);
		await interaction.editReply('Failed to update channel lock. I need Manage Channels in this channel, and the permission overwrite must be editable.');
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channel')
		.setDescription('Lock or unlock a channel')
		.addSubcommand((sub) => sub
			.setName('lock')
			.setDescription('Lock a channel')
			.addChannelOption((opt) => opt.setName('channel').setDescription('Channel to lock').addChannelTypes(ChannelType.GuildText)))
		.addSubcommand((sub) => sub
			.setName('unlock')
			.setDescription('Unlock a channel')
			.addChannelOption((opt) => opt.setName('channel').setDescription('Channel to unlock').addChannelTypes(ChannelType.GuildText)))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	execute: async (interaction) => {
		const sub = interaction.options.getSubcommand();
		if (sub === 'lock') return setLock(interaction, true);
		if (sub === 'unlock') return setLock(interaction, false);
	},
};
