function render(template, values) {
	return String(template || '').replace(/\{([^}]+)\}/g, (_, key) => {
		const v = values?.[key];
		return v !== undefined && v !== null ? String(v) : `{${key}}`;
	});
}

module.exports = { render };
