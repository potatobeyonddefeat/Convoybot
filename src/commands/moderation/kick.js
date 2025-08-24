const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureBotGuildPermissions, isRoleHierarchyHigher } = require('../../utils/permissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server')
		.addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	execute: async (interaction) => {
		const targetUser = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

		const permCheck = ensureBotGuildPermissions(interaction, [PermissionFlagsBits.KickMembers]);
		if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });
		if (!targetMember) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (targetMember.id === interaction.user.id) return interaction.reply({ content: 'You cannot kick yourself.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.member, targetMember)) return interaction.reply({ content: 'Your role is not high enough to kick this user.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.guild.members.me, targetMember)) return interaction.reply({ content: 'My role is not high enough to kick this user.', ephemeral: true });
		if (!targetMember.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			// Non-blocking DM
			targetUser.send(`You have been kicked from ${interaction.guild.name}: ${reason}`).catch(() => {});
			await targetMember.kick(reason);

			interaction.client.audit.log({
				command: 'kick',
				actorId: interaction.user.id,
				actorTag: interaction.user.tag,
				target: `${targetUser.tag} (${targetUser.id})`,
				reason,
				channel: interaction.channel?.name,
			}).catch?.(() => {});

			await interaction.editReply(`Kicked ${targetUser.tag} | Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to kick the user.');
		}
	},
};
