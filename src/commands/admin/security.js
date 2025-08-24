const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateSecurity } = require('../../utils/configStore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('security')
		.setDescription('View and configure Convoy security settings')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((s) => s.setName('status').setDescription('Show current security settings'))
		.addSubcommand((s) => s.setName('toggle').setDescription('Enable or disable all security').addBooleanOption((o) => o.setName('enabled').setDescription('Enable security').setRequired(true)))
		.addSubcommandGroup((g) => g
			.setName('antispam')
			.setDescription('Configure anti-spam')
			.addSubcommand((s) => s.setName('set').setDescription('Set anti-spam window and threshold')
				.addIntegerOption((o) => o.setName('window_ms').setDescription('Window in ms').setRequired(true))
				.addIntegerOption((o) => o.setName('max').setDescription('Max messages in window').setRequired(true))
				.addIntegerOption((o) => o.setName('timeout_seconds').setDescription('Timeout in seconds').setRequired(true))))
		.addSubcommandGroup((g) => g
			.setName('badwords')
			.setDescription('Configure bad-words filter')
			.addSubcommand((s) => s.setName('add').setDescription('Add a bad word').addStringOption((o) => o.setName('word').setDescription('Word').setRequired(true)))
			.addSubcommand((s) => s.setName('remove').setDescription('Remove a bad word').addStringOption((o) => o.setName('word').setDescription('Word').setRequired(true)))
			.addSubcommand((s) => s.setName('toggle_censor').setDescription('Toggle censor repost')))
		.addSubcommandGroup((g) => g
			.setName('raid')
			.setDescription('Configure raid prevention')
			.addSubcommand((s) => s.setName('age').setDescription('Set minimum account age in days')
				.addIntegerOption((o) => o.setName('days').setDescription('Minimum days').setRequired(true)))
			.addSubcommand((s) => s.setName('massjoin').setDescription('Set mass-join threshold and window')
				.addIntegerOption((o) => o.setName('threshold').setDescription('Joins in window to trigger').setRequired(true))
				.addIntegerOption((o) => o.setName('window_ms').setDescription('Window ms').setRequired(true))
				.addIntegerOption((o) => o.setName('lock_minutes').setDescription('Lockdown minutes').setRequired(true)))
			.addSubcommand((s) => s.setName('action').setDescription('Set action for underage accounts')
				.addStringOption((o) => o.setName('type').setDescription('timeout|kick|ban').setRequired(true).addChoices(
					{ name: 'timeout', value: 'timeout' },
					{ name: 'kick', value: 'kick' },
					{ name: 'ban', value: 'ban' }
				)))
		),
	execute: async (interaction, client) => {
		const sec = client.config.security;
		const sub = interaction.options.getSubcommand(false);
		const group = interaction.options.getSubcommandGroup(false);

		if (!group && sub === 'status') {
			return interaction.reply({ ephemeral: true, content: '```json\n' + JSON.stringify(sec, null, 2) + '\n```' });
		}
		if (!group && sub === 'toggle') {
			const enabled = interaction.options.getBoolean('enabled', true);
			client.config.security = updateSecurity(sec, { enabled });
			return interaction.reply({ ephemeral: true, content: `Security is now ${enabled ? 'enabled' : 'disabled'}.` });
		}

		if (group === 'antispam' && sub === 'set') {
			const windowMs = interaction.options.getInteger('window_ms', true);
			const max = interaction.options.getInteger('max', true);
			const timeoutSeconds = interaction.options.getInteger('timeout_seconds', true);
			client.config.security = updateSecurity(sec, { antiSpam: { enabled: true, windowMs, max, timeoutSeconds } });
			return interaction.reply({ ephemeral: true, content: `Anti-spam updated: ${max} msgs / ${windowMs}ms, timeout ${timeoutSeconds}s.` });
		}

		if (group === 'badwords') {
			if (sub === 'add') {
				const word = interaction.options.getString('word', true).trim();
				const list = Array.from(new Set([...(sec.badWords.list || []), word]));
				client.config.security = updateSecurity(sec, { badWords: { list } });
				return interaction.reply({ ephemeral: true, content: `Added word to filter.` });
			}
			if (sub === 'remove') {
				const word = interaction.options.getString('word', true).trim();
				const list = (sec.badWords.list || []).filter((w) => w.toLowerCase() !== word.toLowerCase());
				client.config.security = updateSecurity(sec, { badWords: { list } });
				return interaction.reply({ ephemeral: true, content: `Removed word from filter.` });
			}
			if (sub === 'toggle_censor') {
				const next = !sec.badWords.repostCensored;
				client.config.security = updateSecurity(sec, { badWords: { repostCensored: next } });
				return interaction.reply({ ephemeral: true, content: `Repost censored is now ${next ? 'on' : 'off'}.` });
			}
		}

		if (group === 'raid') {
			if (sub === 'age') {
				const days = interaction.options.getInteger('days', true);
				client.config.security = updateSecurity(sec, { raidMode: { enabled: true, newAccountAgeDays: days } });
				return interaction.reply({ ephemeral: true, content: `Raid: min account age set to ${days} days.` });
			}
			if (sub === 'massjoin') {
				const threshold = interaction.options.getInteger('threshold', true);
				const windowMs = interaction.options.getInteger('window_ms', true);
				const lockdownMinutes = interaction.options.getInteger('lock_minutes', true);
				client.config.security = updateSecurity(sec, { raidMode: { enabled: true, massJoin: { enabled: true, threshold, windowMs, lockdownMinutes } } });
				return interaction.reply({ ephemeral: true, content: `Raid: mass-join threshold ${threshold} in ${windowMs}ms; lockdown ${lockdownMinutes}m.` });
			}
			if (sub === 'action') {
				const type = interaction.options.getString('type', true);
				client.config.security = updateSecurity(sec, { raidMode: { enabled: true, action: type } });
				return interaction.reply({ ephemeral: true, content: `Raid: action set to ${type}.` });
			}
		}

		return interaction.reply({ ephemeral: true, content: 'Unknown option.' });
	},
};
