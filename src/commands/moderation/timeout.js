const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureBotGuildPermissions, isRoleHierarchyHigher } = require('../../utils/permissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout a member for a duration (minutes)')
		.addUserOption((opt) => opt.setName('user').setDescription('User to timeout').setRequired(true))
		.addIntegerOption((opt) => opt.setName('minutes').setDescription('Duration in minutes').setRequired(true))
		.addStringOption((opt) => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	execute: async (interaction) => {
		const targetUser = interaction.options.getUser('user', true);
		const minutes = interaction.options.getInteger('minutes', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

		const permCheck = ensureBotGuildPermissions(interaction, [PermissionFlagsBits.ModerateMembers]);
		if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });
		if (!targetMember) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.member, targetMember)) return interaction.reply({ content: 'Your role is not high enough to timeout this user.', ephemeral: true });
		if (!isRoleHierarchyHigher(interaction.guild.members.me, targetMember)) return interaction.reply({ content: 'My role is not high enough to timeout this user.', ephemeral: true });
		if (minutes <= 0 || minutes > 40320) return interaction.reply({ content: 'Minutes must be between 1 and 40320 (28 days).', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			const ms = minutes * 60 * 1000;
			await targetMember.timeout(ms, reason);

			interaction.client.audit.log({
				command: 'timeout',
				actorId: interaction.user.id,
				actorTag: interaction.user.tag,
				target: `${targetUser.tag} (${targetUser.id})`,
				reason,
				channel: interaction.channel?.name,
				durationMinutes: minutes,
			}).catch?.(() => {});

			await interaction.editReply(`Timed out ${targetUser.tag} for ${minutes} minutes. Reason: ${reason}`);
		} catch (err) {
			await interaction.editReply('Failed to timeout the user.');
		}
	},
};
