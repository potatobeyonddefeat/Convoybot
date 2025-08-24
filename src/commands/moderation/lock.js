const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

async function setLock(interaction, shouldLock) {
	const channel = interaction.options.getChannel('channel') || interaction.channel;
	if (channel.type !== ChannelType.GuildText) return interaction.reply({ content: 'Only text channels are supported.', ephemeral: true });

	await interaction.deferReply({ ephemeral: true });
	try {
		const everyone = interaction.guild.roles.everyone;
		await channel.permissionOverwrites.edit(everyone, { SendMessages: shouldLock ? false : null });
		await interaction.editReply(`${shouldLock ? 'Locked' : 'Unlocked'} ${channel}.`);
	} catch (err) {
		await interaction.editReply('Failed to update channel lock.');
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channel')
		.setDescription('Lock or unlock a channel')
		.addSubcommand((sub) => sub
			.setName('lock')
			.setDescription('Lock a channel')
			.addChannelOption((opt) => opt.setName('channel').setDescription('Channel to lock').addChannelTypes(ChannelType.GuildText)))
		.addSubcommand((sub) => sub
			.setName('unlock')
			.setDescription('Unlock a channel')
			.addChannelOption((opt) => opt.setName('channel').setDescription('Channel to unlock').addChannelTypes(ChannelType.GuildText)))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	execute: async (interaction) => {
		const sub = interaction.options.getSubcommand();
		if (sub === 'lock') return setLock(interaction, true);
		if (sub === 'unlock') return setLock(interaction, false);
	},
};
