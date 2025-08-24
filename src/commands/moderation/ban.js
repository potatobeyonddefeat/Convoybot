const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member from the server')
		.addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	execute: async (interaction) => {
		const user = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (!member.bannable) return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			await user.send(`You have been banned from ${interaction.guild.name}: ${reason}`).catch(() => {});
			await member.ban({ reason });
			await interaction.editReply(`Banned ${user.tag} | Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to ban the user.');
		}
	},
};
