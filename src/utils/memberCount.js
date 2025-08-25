const { ChannelType, OverwriteType, PermissionFlagsBits } = require('discord.js');
const { render } = require('./template');

function getCounts(guild) {
	const total = guild.memberCount;
	const bots = guild.members.cache.filter((m) => m.user.bot).size;
	const members = total - bots;
	return { total, members, bots };
}

async function ensureCategoryAndChannels(guild, config) {
	const ids = { ...config.ids };
	// Category
	let category = ids.categoryId ? guild.channels.cache.get(ids.categoryId) : null;
	if (!category || category.type !== ChannelType.GuildCategory) {
		category = await guild.channels.create({ name: config.categoryName || '📊 Server Stats', type: ChannelType.GuildCategory, reason: 'Member count setup' }).catch(() => null);
		ids.categoryId = category?.id || null;
	}
	if (!category) return { ids, category: null };
	// Permission: hide for everyone (optional), but ensure no one can connect
	try {
		await category.permissionOverwrites.edit(guild.roles.everyone, { Connect: false, SendMessages: false });
	} catch {}

	async function ensureChild(id, name) {
		let ch = id ? guild.channels.cache.get(id) : null;
		if (!ch || ch.type !== ChannelType.GuildVoice) {
			ch = await guild.channels.create({ name, type: ChannelType.GuildVoice, parent: category.id, reason: 'Member count channel' }).catch(() => null);
		} else {
			try { await ch.setParent(category.id).catch(() => {}); } catch {}
		}
		if (ch) {
			try {
				await ch.permissionOverwrites.edit(guild.roles.everyone, { Connect: false, SendMessages: false });
			} catch {}
		}
		return ch;
	}

	const counts = getCounts(guild);
	const totalName = render(config.format.total, counts);
	const membersName = render(config.format.members, counts);
	const botsName = render(config.format.bots, counts);

	const totalCh = await ensureChild(ids.totalId, totalName);
	const membersCh = await ensureChild(ids.membersId, membersName);
	const botsCh = await ensureChild(ids.botsId, botsName);

	ids.totalId = totalCh?.id || ids.totalId;
	ids.membersId = membersCh?.id || ids.membersId;
	ids.botsId = botsCh?.id || ids.botsId;

	return { ids, category };
}

async function updateNames(guild, config) {
	const counts = getCounts(guild);
	const names = {
		total: render(config.format.total, counts),
		members: render(config.format.members, counts),
		bots: render(config.format.bots, counts),
	};
	async function setName(id, name) {
		const ch = id ? guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null) : null;
		if (ch && ch.editable && ch.name !== name) {
			await ch.setName(name).catch(() => {});
		}
	}
	await Promise.all([
		setName(config.ids.totalId, names.total),
		setName(config.ids.membersId, names.members),
		setName(config.ids.botsId, names.bots),
	]);
}

module.exports = { getCounts, ensureCategoryAndChannels, updateNames };
