const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getCatalog } = require('../../utils/commandCatalog');

function buildMenu(access) {
	const options = [
		{ label: 'Overview', value: 'overview', description: 'What Convoy can do' },
	];
	if (access.moderation.length) options.push({ label: 'Moderation', value: 'moderation', description: 'Ban, kick, timeout, purge, slowmode, channel lock' });
	if (access.security.length) options.push({ label: 'Security', value: 'security', description: 'Spam, bad-words, links, raid protection' });
	if (access.admin.length) options.push({ label: 'Admin', value: 'admin', description: 'Security configuration' });

	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder().setCustomId('help:menu').setPlaceholder('Choose a category').addOptions(options)
	);
}

function buildCommandMenu(category, access) {
	let list = [];
	if (category === 'moderation') list = access.moderation;
	else if (category === 'admin') list = access.admin;
	else if (category === 'security') list = getCatalog().securityTopics;
	if (!list.length) return null;

	const options = list.map((c) => ({ label: c.name || c.label, value: `${category}:${c.name || c.key}`, description: c.desc?.slice(0, 100) }));
	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder().setCustomId('help:detail').setPlaceholder('Choose a command/topic for details').addOptions(options)
	);
}

function hasAll(perms, permBits) {
	if (!permBits || permBits.length === 0) return true;
	return permBits.every((bit) => perms.has(bit));
}

function describePerms(bits) {
	if (!bits || bits.length === 0) return 'None';
	return bits.map((b) => {
		for (const [name, val] of Object.entries(PermissionFlagsBits)) if (val === b) return name;
		return String(b);
	}).join(', ');
}

function filterByAccess(interaction) {
	const catalog = getCatalog();
	const me = interaction.guild.members.me;
	const userPerms = interaction.member.permissions;
	const botPerms = me?.permissions;

	function filterList(list) {
		return list.filter((cmd) => hasAll(userPerms, cmd.userPerms) && hasAll(botPerms, cmd.botPerms));
	}

	return {
		moderation: filterList(catalog.moderation),
		admin: filterList(catalog.admin),
		security: catalog.security, // informational list
	};
}

function embedFor(category, access) {
	if (category === 'moderation') {
		const e = new EmbedBuilder().setTitle('Moderation Commands').setColor(0xED4245);
		for (const c of access.moderation) {
			e.addFields({ name: `${c.usage}`, value: `${c.desc}\nUser perms: ${describePerms(c.userPerms)} | Bot perms: ${describePerms(c.botPerms)}` });
		}
		if (access.moderation.length === 0) e.setDescription('You do not have permission to run moderation commands here.');
		return e;
	}
	if (category === 'security') {
		const topics = getCatalog().securityTopics;
		const e = new EmbedBuilder().setTitle('Security & Filters').setColor(0x57F287);
		for (const t of topics) e.addFields({ name: t.label, value: t.desc });
		return e;
	}
	if (category === 'admin') {
		const e = new EmbedBuilder().setTitle('Admin /security').setColor(0xFEE75C);
		for (const c of access.admin) {
			e.addFields({ name: `${c.usage}`, value: `${c.desc}\nUser perms: ${describePerms(c.userPerms)}` });
		}
		if (access.admin.length === 0) e.setDescription('You do not have Administrator permission.');
		return e;
	}
	return new EmbedBuilder()
		.setTitle('Convoy Help')
		.setDescription('Use the menu below to browse help topics you have access to.')
		.addFields(
			{ name: 'Moderation', value: access.moderation.length ? 'You can run moderation commands.' : 'No access to moderation commands.' },
			{ name: 'Security', value: 'Server-wide filters and raid protection.' },
			{ name: 'Admin', value: access.admin.length ? 'You can configure security.' : 'Admin-only.' },
		)
		.setColor(0x5865F2);
}

function detailEmbed(key, interaction) {
	const [category, name] = key.split(':');
	const catalog = getCatalog();
	if (category === 'security') {
		const topic = (catalog.securityTopics || []).find((t) => t.key === name);
		if (!topic) return null;
		return new EmbedBuilder().setTitle(`Security: ${topic.label}`).setDescription(topic.details).setColor(0x57F287);
	}
	const list = category === 'moderation' ? catalog.moderation : catalog.admin;
	const cmd = (list || []).find((c) => c.name === name);
	if (!cmd) return null;
	return new EmbedBuilder()
		.setTitle(`${cmd.name}`)
		.setDescription(`${cmd.desc}`)
		.addFields(
			{ name: 'Usage', value: cmd.usage },
			{ name: 'User permissions', value: describePerms(cmd.userPerms) },
			{ name: 'Bot permissions', value: describePerms(cmd.botPerms) },
		)
		.setColor(category === 'admin' ? 0xFEE75C : 0xED4245);
}

module.exports = {
	data: new SlashCommandBuilder().setName('help').setDescription('Show Convoy help with an interactive menu'),
	execute: async (interaction) => {
		const access = filterByAccess(interaction);
		await interaction.reply({ embeds: [embedFor('overview', access)], components: [buildMenu(access)], ephemeral: true });
	},
	helpHandlers: {
		buildMenu,
		buildCommandMenu,
		embedFor,
		filterByAccess,
		detailEmbed,
	},
};
