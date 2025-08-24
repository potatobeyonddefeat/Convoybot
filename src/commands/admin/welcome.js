const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateWelcome } = require('../../utils/configStore');
const { render } = require('../../utils/template');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('welcome')
		.setDescription('Configure and preview the welcome message')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('status').setDescription('Show current welcome settings'))
		.addSubcommand((s) => s.setName('toggle').setDescription('Enable or disable welcome messages').addBooleanOption((o) => o.setName('enabled').setDescription('Enable').setRequired(true)))
		.addSubcommand((s) => s.setName('channel').setDescription('Set the welcome channel').addChannelOption((o) => o.setName('channel').setDescription('Text channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
		.addSubcommand((s) => s.setName('template').setDescription('Set the welcome template').addStringOption((o) => o.setName('text').setDescription('Template text').setRequired(true)))
		.addSubcommand((s) => s.setName('placeholders').setDescription('Set common placeholders').addStringOption((o) => o.setName('rules').setDescription('Rules channel mention like #rules')).addStringOption((o) => o.setName('introductions').setDescription('Introductions channel mention like #introductions')))
		.addSubcommand((s) => s.setName('preview').setDescription('Preview the welcome message here')),
	execute: async (interaction, client) => {
		const conf = client.config.welcome;
		const sub = interaction.options.getSubcommand(true);
		if (sub === 'status') {
			return interaction.reply({ ephemeral: true, content: '```json\n' + JSON.stringify(conf, null, 2) + '\n```' });
		}
		if (sub === 'toggle') {
			const enabled = interaction.options.getBoolean('enabled', true);
			client.config.welcome = updateWelcome(conf, { enabled });
			return interaction.reply({ ephemeral: true, content: `Welcome messages ${enabled ? 'enabled' : 'disabled'}.` });
		}
		if (sub === 'channel') {
			const channel = interaction.options.getChannel('channel', true);
			client.config.welcome = updateWelcome(conf, { channelId: channel.id });
			return interaction.reply({ ephemeral: true, content: `Welcome channel set to ${channel}.` });
		}
		if (sub === 'template') {
			const text = interaction.options.getString('text', true);
			client.config.welcome = updateWelcome(conf, { template: text });
			return interaction.reply({ ephemeral: true, content: 'Updated template.' });
		}
		if (sub === 'placeholders') {
			const rules = interaction.options.getString('rules');
			const introductions = interaction.options.getString('introductions');
			const next = { ...conf.placeholders };
			if (rules !== null) next.rules = rules;
			if (introductions !== null) next.introductions = introductions;
			client.config.welcome = updateWelcome(conf, { placeholders: next });
			return interaction.reply({ ephemeral: true, content: 'Updated placeholders.' });
		}
		if (sub === 'preview') {
			const sample = render(conf.template, {
				user: interaction.user.toString(),
				server: interaction.guild.name,
				...conf.placeholders,
			});
			return interaction.reply({ ephemeral: true, content: sample });
		}
	},
};
