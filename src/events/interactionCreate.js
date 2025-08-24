module.exports = {
	name: 'interactionCreate',
	execute: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute(interaction, client);
		} catch (error) {
			client.logger.error(`Command execution error in /${interaction.commandName}`, error?.stack || error);
			const msg = 'There was an error executing this command.';
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
			} else {
				await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
			}
		}
	},
};
