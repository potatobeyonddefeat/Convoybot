async function dmUser(client, userId, content) {
	try {
		const user = await client.users.fetch(userId).catch(() => null);
		if (!user) return false;
		await user.send(content).catch(() => {});
		return true;
	} catch {
		return false;
	}
}

async function notifyModeration(client, targetUserId, message) {
	if (!client.config.notifier?.dmOnModeration) return false;
	return dmUser(client, targetUserId, message);
}

async function notifyFilter(client, targetUserId, message) {
	if (!client.config.notifier?.dmOnFilter) return false;
	return dmUser(client, targetUserId, message);
}

async function notifyAdminError(client, error) {
	if (!client.config.notifier?.adminNotifyOnError) return false;
	const adminId = client.config.notifier.adminUserId;
	if (!adminId) return false;
	const msg = `Convoy error: ${error?.message || error}`.slice(0, 1800);
	return dmUser(client, adminId, msg);
}

module.exports = { dmUser, notifyModeration, notifyFilter, notifyAdminError };
