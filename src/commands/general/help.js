const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function buildMenu() {
	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId('help:menu')
			.setPlaceholder('Choose a category')
			.addOptions(
				{ label: 'Overview', value: 'overview', description: 'What Convoy can do' },
				{ label: 'Moderation', value: 'moderation', description: 'Ban, kick, timeout, purge, slowmode, channel lock' },
				{ label: 'Security', value: 'security', description: 'Spam, bad-words, links, raid protection' },
				{ label: 'Admin', value: 'admin', description: 'Security configuration' },
			)
	);
}

function overviewEmbed() {
	return new EmbedBuilder()
		.setTitle('Convoy Help')
		.setDescription('Convoy is a social-navigation bot for car enthusiasts, focused on moderation and security for convoy servers.')
		.addFields(
			{ name: 'Get started', value: 'Use the menu below to browse help topics.' },
			{ name: 'Need permissions?', value: 'Some commands require server permissions. The bot must also have the necessary permissions.' },
		)
		.setColor(0x5865F2);
}

function moderationEmbed() {
	return new EmbedBuilder()
		.setTitle('Moderation Commands')
		.setColor(0xED4245)
		.addFields(
			{ name: '/ban user reason?', value: 'Ban a member. Example: `/ban user:@User reason:spam`' },
			{ name: '/kick user reason?', value: 'Kick a member. Example: `/kick user:@User reason:rules`' },
			{ name: '/timeout user minutes reason?', value: 'Timeout a member. Example: `/timeout user:@User minutes:30 reason:cooldown`' },
			{ name: '/purge count channel?', value: 'Delete 1–100 messages. Example: `/purge count:25 channel:#chat`' },
			{ name: '/slowmode seconds channel?', value: 'Set channel slowmode. Example: `/slowmode seconds:10 channel:#chat`' },
			{ name: '/channel lock|unlock channel?', value: 'Lock or unlock a channel. Example: `/channel lock channel:#rules`' },
		);
}

function securityEmbed() {
	return new EmbedBuilder()
		.setTitle('Security & Filters')
		.setColor(0x57F287)
		.addFields(
			{ name: 'Anti-spam', value: 'Rate-limits rapid messages and can auto-timeout offenders.' },
			{ name: 'Bad-words filter', value: 'Deletes and optionally reposts censored messages.' },
			{ name: 'Links policy', value: 'Blocks non-whitelisted links and invite links.' },
			{ name: 'Mentions limit', value: 'Prevents mass-mention abuse.' },
			{ name: 'Raid prevention', value: 'Account-age checks and mass-join lockdown.' },
		);
}

function adminEmbed() {
	return new EmbedBuilder()
		.setTitle('Admin /security')
		.setColor(0xFEE75C)
		.addFields(
			{ name: '/security status', value: 'Show current security settings.' },
			{ name: '/security toggle enabled:true|false', value: 'Enable/disable all security.' },
			{ name: '/security antispam set', value: 'Configure anti-spam window, max, and timeout.' },
			{ name: '/security badwords add/remove/toggle_censor', value: 'Manage bad-words and censoring.' },
			{ name: '/security raid age | massjoin', value: 'Configure raid prevention thresholds.' },
		);
}

module.exports = {
	data: new SlashCommandBuilder().setName('help').setDescription('Show Convoy help with an interactive menu'),
	execute: async (interaction) => {
		await interaction.reply({ embeds: [overviewEmbed()], components: [buildMenu()], ephemeral: true });
	},
	// Expose helper for interaction handler
	helpHandlers: {
		buildMenu,
		overviewEmbed,
		moderationEmbed,
		securityEmbed,
		adminEmbed,
	},
};
