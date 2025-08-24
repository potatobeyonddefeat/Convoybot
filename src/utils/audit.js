const fs = require('fs');
const path = require('path');

function formatLocalTimestamp(date = new Date()) {
	const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return d.toISOString().replace('T', ' ').replace('Z', '');
}

function ensureFile(filePath) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '', 'utf8');
}

function createAudit(client) {
	const cfg = client.config.audit || {};
	const fileEnabled = !!cfg.fileEnabled;
	const filePath = cfg.filePath || 'logs/audit.log';
	if (fileEnabled) ensureFile(filePath);

	async function log(entry) {
		try {
			const ts = formatLocalTimestamp();
			const payload = { ts, ...entry };
			const line = JSON.stringify(payload) + '\n';

			if (fileEnabled) {
				fs.appendFile(filePath, line, () => {});
			}

			if (cfg.enabled && cfg.channelId) {
				const channel = client.channels.cache.get(cfg.channelId) || await client.channels.fetch(cfg.channelId).catch(() => null);
				if (channel && channel.send) {
					const human = `[` + ts + `] ` +
						`by ${entry.actorTag || entry.actorId} ran /${entry.command} ` +
						(entry.target ? `→ target: ${entry.target}` : '') +
						(entry.channel ? ` in #${entry.channel}` : '') +
						(entry.reason ? ` | reason: ${entry.reason}` : '');
					channel.send({ content: human }).catch(() => {});
				}
			}
		} catch (e) {
			client.logger?.error?.('Audit log failed', e);
		}
	}

	return { log };
}

module.exports = { createAudit, formatLocalTimestamp };
