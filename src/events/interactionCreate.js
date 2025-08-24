const helpModule = require('../commands/general/help');

module.exports = {
	name: 'interactionCreate',
	execute: async (client, interaction) => {
		try {
			if (interaction.isChatInputCommand()) {
				const command = client.commands.get(interaction.commandName);
				if (!command) return;
				await command.execute(interaction, client);
				return;
			}

			if (interaction.isStringSelectMenu() && interaction.customId === 'help:menu') {
				const value = interaction.values?.[0];
				let embed;
				switch (value) {
					case 'moderation': embed = helpModule.helpHandlers.moderationEmbed(); break;
					case 'security': embed = helpModule.helpHandlers.securityEmbed(); break;
					case 'admin': embed = helpModule.helpHandlers.adminEmbed(); break;
					case 'overview':
					default: embed = helpModule.helpHandlers.overviewEmbed();
				}
				await interaction.update({ embeds: [embed], components: [helpModule.helpHandlers.buildMenu()] });
				return;
			}
		} catch (error) {
			client.logger.error(`Interaction error`, error?.stack || error);
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ content: 'There was an error executing this interaction.', ephemeral: true }).catch(() => {});
			} else if (interaction.isChatInputCommand()) {
				await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true }).catch(() => {});
			}
		}
	},
};
