const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('appeal').setDescription('Submit a ban appeal (use in DMs with the bot)'),
	execute: async (interaction) => {
		const cfg = interaction.client.config.appeals;
		if (!cfg?.enabled) return interaction.reply({ ephemeral: true, content: 'Appeals are not enabled.' });
		const modal = new ModalBuilder().setCustomId('appeal:modal').setTitle(cfg.form?.title || 'Ban Appeal');
		const fields = cfg.form?.fields || ['Why should we lift your ban?', 'What happened?', 'Anything else we should know?'];
		const rows = fields.slice(0, 3).map((label, idx) => new ActionRowBuilder().addComponents(
			new TextInputBuilder().setCustomId(`appeal:field${idx}`).setLabel(label).setStyle(TextInputStyle.Paragraph).setRequired(idx < 2)
		));
		modal.addComponents(...rows);
		await interaction.showModal(modal);
	},
};
