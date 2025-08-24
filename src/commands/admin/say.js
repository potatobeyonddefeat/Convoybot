const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { ensureBotChannelPermissions, isTextChannel } = require('../../utils/permissions');

const ALLOWED_USER_ID = '1249576473740841058';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Send a message as the bot (owner-only)')
		.addStringOption((opt) => opt.setName('message').setDescription('Message to send').setRequired(true))
		.addChannelOption((opt) => opt.setName('channel').setDescription('Target channel').addChannelTypes(ChannelType.GuildText))
		.setDMPermission(false),
	execute: async (interaction) => {
		if (interaction.user.id !== ALLOWED_USER_ID) {
			return interaction.reply({ content: 'Not authorized.', ephemeral: true });
		}

		const channel = interaction.options.getChannel('channel') || interaction.channel;
		const text = interaction.options.getString('message', true).slice(0, 2000);
		if (!isTextChannel(channel)) {
			return interaction.reply({ content: 'Please choose a text channel.', ephemeral: true });
		}

		const permCheck = ensureBotChannelPermissions(interaction, channel, [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]);
		if (!permCheck.ok) return interaction.reply({ content: permCheck.message, ephemeral: true });

		await channel.send({ content: text }).catch(() => {});
		return interaction.reply({ content: `Sent to ${channel}.`, ephemeral: true });
	},
};
