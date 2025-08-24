const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout a member for a duration (minutes)')
		.addUserOption((opt) => opt.setName('user').setDescription('User to timeout').setRequired(true))
		.addIntegerOption((opt) => opt.setName('minutes').setDescription('Duration in minutes').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	execute: async (interaction) => {
		const user = interaction.options.getUser('user', true);
		const minutes = interaction.options.getInteger('minutes', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout this user.', ephemeral: true });
		if (minutes <= 0 || minutes > 40320) return interaction.reply({ content: 'Minutes must be between 1 and 40320 (28 days).', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			const ms = minutes * 60 * 1000;
			await member.timeout(ms, reason);
			await interaction.editReply(`Timed out ${user.tag} for ${minutes} minutes. Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to timeout the user.');
		}
	},
};
