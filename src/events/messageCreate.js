const { EmbedBuilder } = require('discord.js');
const { notifyFilter } = require('../utils/notifier');
const urlRegex = /https?:\/\/[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:\/?#\[\]@!$&'\(\)\*\+,;=.]+/gi;

const recentMessages = new Map(); // userId -> { timestamps: number[] }

function isAllowedDomain(url, allowList) {
	try {
		const u = new URL(url);
		return allowList.some((d) => u.hostname.endsWith(d));
	} catch {
		return false;
	}
}

function censor(content, words, maskChar) {
	let out = content;
	for (const word of words) {
		if (!word) continue;
		const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const re = new RegExp(escaped, 'gi');
		out = out.replace(re, (m) => maskChar.repeat(Math.max(m.length, 3)));
	}
	return out;
}

module.exports = {
	name: 'messageCreate',
	execute: async (client, message) => {
		if (!message.guild || message.author.bot) return;
		const cfg = client.config.security;
		if (!cfg?.enabled) return;

		// Mentions limit
		if (cfg.mentions?.enabled) {
			const mentionsCount = (message.mentions.users.size || 0) + (message.mentions.roles.size || 0) + (message.mentions.everyone ? 1 : 0);
			if (mentionsCount > (cfg.mentions.maxMentions || 5)) {
				await message.delete().catch(() => {});
				client.audit.log({ command: 'filter.mentions', actorId: message.author.id, actorTag: message.author.tag, channel: message.channel?.name, target: `${mentionsCount} mentions` });
				notifyFilter(client, message.author.id, `Your message in #${message.channel?.name} was removed for too many mentions.`).catch(() => {});
				return message.channel.send({ content: `${message.author}, too many mentions.` }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
			}
		}

		// Bad words
		if (cfg.badWords?.enabled && Array.isArray(cfg.badWords.list) && cfg.badWords.list.length) {
			const contentLower = message.content.toLowerCase();
			const matched = cfg.badWords.list.find((w) => contentLower.includes(w.toLowerCase()));
			if (matched) {
				client.audit.log({ command: 'filter.badword', actorId: message.author.id, actorTag: message.author.tag, channel: message.channel?.name, target: matched });
				if (cfg.badWords.delete) await message.delete().catch(() => {});
				notifyFilter(client, message.author.id, `Your message in #${message.channel?.name} contained prohibited language and was removed.`).catch(() => {});
				if (cfg.badWords.censor && cfg.badWords.repostCensored) {
					const censored = censor(message.content, cfg.badWords.list, cfg.badWords.maskChar || '*');
					message.channel.send({ content: `${message.author}: ${censored}` }).catch(() => {});
				}
				if (cfg.badWords.warn) {
					message.channel.send({ content: `${message.author}, watch your language.` }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
				}
				return;
			}
		}

		// Links
		if (cfg.links?.enabled && urlRegex.test(message.content)) {
			urlRegex.lastIndex = 0;
			const urls = message.content.match(urlRegex) || [];
			const blocked = urls.some((u) => !isAllowedDomain(u, cfg.links.allowDomainList || []));
			const inviteBlocked = cfg.links.blockInvites && /(discord\.gg|discord\.com\/invite)/i.test(message.content);
			if (blocked || inviteBlocked) {
				await message.delete().catch(() => {});
				client.audit.log({ command: 'filter.links', actorId: message.author.id, actorTag: message.author.tag, channel: message.channel?.name, target: 'link removed' });
				notifyFilter(client, message.author.id, `Your message in #${message.channel?.name} included a disallowed link and was removed.`).catch(() => {});
				return message.channel.send({ content: `${message.author}, links are not allowed here.` }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
			}
		}

		// Anti-spam
		if (cfg.antiSpam?.enabled) {
			const now = Date.now();
			const windowMs = cfg.antiSpam.windowMs || 7000;
			const max = cfg.antiSpam.max || 5;

			const data = recentMessages.get(message.author.id) || { timestamps: [] };
			data.timestamps = data.timestamps.filter((t) => now - t < windowMs);
			data.timestamps.push(now);
			recentMessages.set(message.author.id, data);

			if (data.timestamps.length > max) {
				await message.member?.timeout((cfg.antiSpam.timeoutSeconds || 300) * 1000, 'Anti-spam');
				client.audit.log({ command: 'filter.spam', actorId: message.author.id, actorTag: message.author.tag, channel: message.channel?.name, target: `${data.timestamps.length} msgs/${windowMs}ms` });
				notifyFilter(client, message.author.id, `You were rate-limited for sending messages too quickly in #${message.channel?.name}.`).catch(() => {});
				await message.channel.send({ content: `${message.author}, you are sending messages too quickly.` }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
			}
		}
	},
};
