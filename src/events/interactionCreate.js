module.exports = {
	name: 'interactionCreate',
	execute: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute(interaction, client);
		} catch (error) {
			client.logger.error('Command execution error', error);
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ content: 'There was an error executing this command.', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
			}
		}
	},
};
