const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ensureBotChannelPermissions, isTextChannel } = require('../../utils/permissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Bulk delete messages in a channel')
		.addIntegerOption((opt) => opt.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(true))
		.addChannelOption((opt) => opt.setName('channel').setDescription('Channel to purge').addChannelTypes(ChannelType.GuildText))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	execute: async (interaction) => {
		const count = interaction.options.getInteger('count', true);
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		if (count <= 0 || count > 100) return interaction.reply({ content: 'Count must be 1-100.', ephemeral: true });
		if (!isTextChannel(channel)) return interaction.reply({ content: 'Only text channels are supported.', ephemeral: true });

		const permCheck = ensureBotChannelPermissions(interaction, channel, [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory]);
		if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			const deleted = await channel.bulkDelete(count, true);
			interaction.client.audit.log({
				command: 'purge',
				actorId: interaction.user.id,
				actorTag: interaction.user.tag,
				channel: channel?.name,
				deletedCount: deleted.size,
			}).catch?.(() => {});

			if (deleted.size === 0) {
				await interaction.editReply('No messages were deleted. Messages older than 14 days cannot be deleted.');
			} else {
				await interaction.editReply(`Deleted ${deleted.size} messages in ${channel}.`);
			}
		} catch (err) {
			await interaction.editReply('Failed to purge messages. I need Manage Messages and Read Message History in this channel, and cannot delete messages older than 14 days.');
		}
	},
};
