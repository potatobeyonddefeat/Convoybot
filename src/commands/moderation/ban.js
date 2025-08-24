const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureBotGuildPermissions, isRoleHierarchyHigher } = require('../../utils/permissions');
const { notifyModeration } = require('../../utils/notifier');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member from the server')
		.addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	execute: async (interaction) => {
		const targetUser = interaction.options.getUser('user', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

		const permCheck = ensureBotGuildPermissions(interaction, [PermissionFlagsBits.BanMembers]);
		if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });
		if (!targetMember) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (targetMember.id === interaction.user.id) return interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.member, targetMember)) return interaction.reply({ content: 'Your role is not high enough to ban this user.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.guild.members.me, targetMember)) return interaction.reply({ content: 'My role is not high enough to ban this user.', ephemeral: true });
		if (!targetMember.bannable) return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			// Fire-and-forget DM via notifier
			notifyModeration(interaction.client, targetUser.id, `You have been banned from ${interaction.guild.name}. Reason: ${reason}`).catch(() => {});
			await targetMember.ban({ reason });

			interaction.client.audit.log({
				command: 'ban',
				actorId: interaction.user.id,
				actorTag: interaction.user.tag,
				target: `${targetUser.tag} (${targetUser.id})`,
				reason,
				channel: interaction.channel?.name,
			}).catch?.(() => {});

			await interaction.editReply(`Banned ${targetUser.tag} | Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to ban the user.');
		}
	},
};
