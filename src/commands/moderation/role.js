const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function canEditRole(actorMember, role) {
	if (!actorMember || !role) return false;
	return actorMember.roles.highest.comparePositionTo(role) > 0;
}

function canBotEditRole(guild, role) {
	const me = guild.members.me;
	if (!me) return false;
	return canEditRole(me, role);
}

function isValidRole(role, guild) {
	if (!role || role.id === guild.roles.everyone.id) return false;
	if (role.managed) return false; // Bot cannot edit integration-managed roles
	return true;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Add or remove roles from members')
		.addSubcommand((sub) => sub
			.setName('add')
			.setDescription('Give a role to a member')
			.addUserOption((o) => o.setName('user').setDescription('Target member').setRequired(true))
			.addRoleOption((o) => o.setName('role').setDescription('Role to give').setRequired(true))
			.addStringOption((o) => o.setName('reason').setDescription('Reason (optional)')))
		.addSubcommand((sub) => sub
			.setName('remove')
			.setDescription('Remove a role from a member')
			.addUserOption((o) => o.setName('user').setDescription('Target member').setRequired(true))
			.addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))
			.addStringOption((o) => o.setName('reason').setDescription('Reason (optional)')))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
	execute: async (interaction) => {
		const sub = interaction.options.getSubcommand();
		const user = interaction.options.getUser('user', true);
		const role = interaction.options.getRole('role', true);
		const reason = interaction.options.getString('reason') || 'No reason provided';

		const guild = interaction.guild;
		if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

		if (!isValidRole(role, guild)) {
			return interaction.reply({ content: 'That role cannot be edited.', ephemeral: true });
		}

		if (!canEditRole(interaction.member, role)) {
			return interaction.reply({ content: 'Your highest role must be above the target role.', ephemeral: true });
		}
		if (!canBotEditRole(guild, role)) {
			return interaction.reply({ content: 'My highest role must be above the target role.', ephemeral: true });
		}

		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });

		await interaction.deferReply({ ephemeral: true });
		try {
			if (sub === 'add') {
				if (member.roles.cache.has(role.id)) {
					await interaction.editReply(`${user.tag} already has ${role.name}.`);
					return;
				}
				await member.roles.add(role, reason);
				interaction.client.audit.log({ command: 'role.add', actorId: interaction.user.id, actorTag: interaction.user.tag, target: `${user.tag} (${user.id})`, role: role.name, reason, channel: interaction.channel?.name }).catch?.(() => {});
				await interaction.editReply(`Added ${role} to ${user.tag}.`);
			} else if (sub === 'remove') {
				if (!member.roles.cache.has(role.id)) {
					await interaction.editReply(`${user.tag} does not have ${role.name}.`);
					return;
				}
				await member.roles.remove(role, reason);
				interaction.client.audit.log({ command: 'role.remove', actorId: interaction.user.id, actorTag: interaction.user.tag, target: `${user.tag} (${user.id})`, role: role.name, reason, channel: interaction.channel?.name }).catch?.(() => {});
				await interaction.editReply(`Removed ${role} from ${user.tag}.`);
			}
		} catch (err) {
			await interaction.editReply('Failed to modify roles. I need Manage Roles and must be above the role.');
		}
	},
};
