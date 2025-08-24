const helpModule = require('../commands/general/help');
const { notifyAdminError } = require('../utils/notifier');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createOneTimeInvite } = require('../utils/invite');

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

			// Appeal modal submission
			if (interaction.isModalSubmit() && interaction.customId === 'appeal:modal') {
				const guilds = client.guilds.cache;
				const conf = client.config.appeals;
				if (!conf?.enabled || !conf.reviewChannelId) return interaction.reply({ ephemeral: true, content: 'Appeals are not available right now.' });

				const responses = [];
				for (let i = 0; i < 3; i++) {
					const v = interaction.fields.getTextInputValue(`appeal:field${i}`) || '';
					if (v) responses.push(v);
				}

				const embed = new EmbedBuilder()
					.setTitle('Ban Appeal')
					.addFields(
						{ name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
						{ name: 'Responses', value: responses.map((r, idx) => `Q${idx + 1}: ${r}`).join('\n\n').slice(0, 3900) || 'No response' },
					)
					.setTimestamp(Date.now())
					.setColor(0x5865F2);

				const buttons = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId(`appeal:approve:${interaction.user.id}`).setLabel('Approve (Unban)').setStyle(ButtonStyle.Success),
					new ButtonBuilder().setCustomId(`appeal:deny:${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
				);

				// Send to every guild that has the review channel id (in case of multiple guilds sharing config)
				let sent = false;
				for (const [, guild] of guilds) {
					const ch = guild.channels.cache.get(conf.reviewChannelId) || await guild.channels.fetch(conf.reviewChannelId).catch(() => null);
					if (ch && ch.send) {
						await ch.send({ embeds: [embed], components: [buttons] }).catch(() => {});
						sent = true;
					}
				}
				await interaction.reply({ ephemeral: true, content: sent ? 'Your appeal has been submitted.' : 'Could not submit appeal. Please try again later.' });
				return;
			}

			// Admin review buttons
			if (interaction.isButton() && interaction.customId.startsWith('appeal:')) {
				const [_, action, userId] = interaction.customId.split(':');
				if (!interaction.memberPermissions?.has('BanMembers')) {
					return interaction.reply({ ephemeral: true, content: 'You need Ban Members to process appeals.' });
				}
				try {
					const user = await interaction.client.users.fetch(userId).catch(() => null);
					if (action === 'approve') {
						await interaction.guild?.bans.remove(userId, 'Appeal approved').catch(() => {});
						let inviteUrl = '';
						try {
							const guild = interaction.guild || (interaction.guildId ? await interaction.client.guilds.fetch(interaction.guildId).catch(() => null) : null);
							if (guild) {
								const { url } = await createOneTimeInvite(guild, interaction.client.config.invites?.preferredChannelId, 'Appeal approved reinvite');
								inviteUrl = url;
							}
						} catch {}
						await interaction.update({ content: `Appeal approved by ${interaction.user.tag}. User unbanned.`, components: [], embeds: interaction.message.embeds });
						if (user) user.send(`Your appeal was approved in ${interaction.guild?.name || 'the server'}. You have been unbanned.
Rejoin link (24h, single-use): ${inviteUrl || 'Invite unavailable'}`).catch(() => {});
						interaction.client.audit.log({ command: 'appeal.approve', actorId: interaction.user.id, actorTag: interaction.user.tag, target: `${user?.tag || userId}` });
					} else if (action === 'deny') {
						await interaction.update({ content: `Appeal denied by ${interaction.user.tag}.`, components: [], embeds: interaction.message.embeds });
						if (user) user.send(`Your appeal was denied in ${interaction.guild?.name || 'the server'}.`).catch(() => {});
						interaction.client.audit.log({ command: 'appeal.deny', actorId: interaction.user.id, actorTag: interaction.user.tag, target: `${user?.tag || userId}` });
					}
				} catch (e) {
					interaction.client.logger.error('Appeal handling failed', e);
					return interaction.reply({ ephemeral: true, content: 'Failed to process appeal.' });
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
