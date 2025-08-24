const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slowmode')
		.setDescription('Set slowmode for a channel (seconds)')
		.addIntegerOption((opt) => opt.setName('seconds').setDescription('Seconds (0-21600)').setRequired(true))
		.addChannelOption((opt) => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	execute: async (interaction) => {
		const seconds = interaction.options.getInteger('seconds', true);
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		if (seconds < 0 || seconds > 21600) return interaction.reply({ content: 'Seconds must be 0-21600.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			await channel.setRateLimitPerUser(seconds, 'Set by slowmode command');
			await interaction.editReply(`Set slowmode in ${channel} to ${seconds}s.`);
		} catch (err) {
			await interaction.editReply('Failed to set slowmode.');
		}
	},
};
