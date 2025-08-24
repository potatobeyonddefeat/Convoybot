const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server')
		.addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	execute: async (interaction) => {
		const user = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			await user.send(`You have been kicked from ${interaction.guild.name}: ${reason}`).catch(() => {});
			await member.kick(reason);
			await interaction.editReply(`Kicked ${user.tag} | Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to kick the user.');
		}
	},
};
