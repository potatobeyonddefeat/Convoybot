const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

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

		await interaction.deferReply({ ephemeral: true });
		try {
			const deleted = await channel.bulkDelete(count, true);
			await interaction.editReply(`Deleted ${deleted.size} messages in ${channel}.`);
		} catch (err) {
			await interaction.editReply('Failed to purge messages. Note: Cannot delete messages older than 14 days.');
		}
	},
};
