const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureCategoryAndChannels, updateNames } = require('../../utils/memberCount');
const { updateMemberCount } = require('../../utils/configStore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('membercount')
		.setDescription('Manage member count tracker')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('status').setDescription('Show current settings'))
		.addSubcommand((s) => s.setName('toggle').setDescription('Enable or disable tracker').addBooleanOption((o) => o.setName('enabled').setDescription('Enable').setRequired(true)))
		.addSubcommand((s) => s.setName('setup').setDescription('Create/repair the stats category and channels'))
		.addSubcommand((s) => s.setName('format').setDescription('Update display formats')
			.addStringOption((o) => o.setName('total').setDescription('e.g., All members: {total}'))
			.addStringOption((o) => o.setName('members').setDescription('e.g., Members: {members}'))
			.addStringOption((o) => o.setName('bots').setDescription('e.g., Bots: {bots}')))
		.addSubcommand((s) => s.setName('show').setDescription('Choose which counters to display')
			.addBooleanOption((o) => o.setName('total').setDescription('Show total counter'))
			.addBooleanOption((o) => o.setName('members').setDescription('Show members counter'))
			.addBooleanOption((o) => o.setName('bots').setDescription('Show bots counter'))),
	execute: async (interaction, client) => {
		const sub = interaction.options.getSubcommand(true);
		const cfg = client.config.memberCount;
		if (sub === 'status') {
			return interaction.reply({ ephemeral: true, content: '```json\n' + JSON.stringify(cfg, null, 2) + '\n```' });
		}
		if (sub === 'toggle') {
			const enabled = interaction.options.getBoolean('enabled', true);
			client.config.memberCount = updateMemberCount(cfg, { enabled });
			return interaction.reply({ ephemeral: true, content: `Member count ${enabled ? 'enabled' : 'disabled'}.` });
		}
		if (sub === 'setup') {
			await interaction.deferReply({ ephemeral: true });
			const result = await ensureCategoryAndChannels(interaction.guild, cfg);
			client.config.memberCount = updateMemberCount(cfg, { ids: result.ids });
			await updateNames(interaction.guild, client.config.memberCount);
			return interaction.editReply('Member count channels ensured and updated.');
		}
		if (sub === 'format') {
			const total = interaction.options.getString('total');
			const members = interaction.options.getString('members');
			const bots = interaction.options.getString('bots');
			const next = { ...cfg.format };
			if (total !== null) next.total = total;
			if (members !== null) next.members = members;
			if (bots !== null) next.bots = bots;
			client.config.memberCount = updateMemberCount(cfg, { format: next });
			await updateNames(interaction.guild, client.config.memberCount);
			return interaction.reply({ ephemeral: true, content: 'Formats updated.' });
		}
		if (sub === 'show') {
			const total = interaction.options.getBoolean('total');
			const members = interaction.options.getBoolean('members');
			const bots = interaction.options.getBoolean('bots');
			const next = { ...cfg.show };
			if (total !== null) next.total = total;
			if (members !== null) next.members = members;
			if (bots !== null) next.bots = bots;
			client.config.memberCount = updateMemberCount(cfg, { show: next });
			const result = await ensureCategoryAndChannels(interaction.guild, client.config.memberCount);
			client.config.memberCount = updateMemberCount(client.config.memberCount, { ids: result.ids });
			await updateNames(interaction.guild, client.config.memberCount);
			return interaction.reply({ ephemeral: true, content: 'Visibility updated.' });
		}
	},
};
