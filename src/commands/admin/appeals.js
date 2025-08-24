const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateAppeals } = require('../../utils/configStore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('appeals')
		.setDescription('Configure appeals')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('channel').setDescription('Set the appeals review channel').addChannelOption((o) => o.setName('channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
		.addSubcommand((s) => s.setName('toggle').setDescription('Enable or disable appeals').addBooleanOption((o) => o.setName('enabled').setDescription('Enable').setRequired(true)))
		.addSubcommand((s) => s.setName('status').setDescription('Show current appeals settings')),
	execute: async (interaction, client) => {
		const sub = interaction.options.getSubcommand(true);
		const conf = client.config.appeals;
		if (sub === 'status') return interaction.reply({ ephemeral: true, content: '```json\n' + JSON.stringify(conf, null, 2) + '\n```' });
		if (sub === 'toggle') {
			const enabled = interaction.options.getBoolean('enabled', true);
			client.config.appeals = updateAppeals(conf, { enabled });
			return interaction.reply({ ephemeral: true, content: `Appeals ${enabled ? 'enabled' : 'disabled'}.` });
		}
		if (sub === 'channel') {
			const channel = interaction.options.getChannel('channel', true);
			client.config.appeals = updateAppeals(conf, { reviewChannelId: channel.id });
			return interaction.reply({ ephemeral: true, content: `Appeals review channel set to ${channel}.` });
		}
	},
};
