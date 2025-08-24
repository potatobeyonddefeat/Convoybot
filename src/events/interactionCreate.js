const helpModule = require('../commands/general/help');
const { notifyAdminError } = require('../utils/notifier');

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
				const access = helpModule.helpHandlers.filterByAccess(interaction);
				const value = interaction.values?.[0] || 'overview';
				const embed = helpModule.helpHandlers.embedFor(value, access);
				const second = helpModule.helpHandlers.buildCommandMenu(value, access);
				const components = [helpModule.helpHandlers.buildMenu(access)];
				if (second) components.push(second);
				await interaction.update({ embeds: [embed], components });
				return;
			}

			if (interaction.isStringSelectMenu() && interaction.customId === 'help:detail') {
				const key = interaction.values?.[0];
				const embed = helpModule.helpHandlers.detailEmbed(key, interaction);
				if (embed) {
					await interaction.update({ embeds: [embed], components: interaction.message.components });
				}
				return;
			}
		} catch (error) {
			client.logger.error(`Interaction error`, error?.stack || error);
			notifyAdminError(client, error);
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ content: 'There was an error executing this interaction.', ephemeral: true }).catch(() => {});
			} else if (interaction.isChatInputCommand()) {
				await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true }).catch(() => {});
			}
		}
	},
};
