const fs = require('fs');
const path = require('path');

const STORE_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(STORE_DIR, 'security.json');

function ensureStore() {
	if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
	if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({}, null, 2));
}

function deepMerge(base, override) {
	if (typeof base !== 'object' || base === null) return override;
	const out = Array.isArray(base) ? [...base] : { ...base };
	for (const key of Object.keys(override || {})) {
		const b = base[key];
		const o = override[key];
		if (Array.isArray(b) && Array.isArray(o)) out[key] = [...o];
		else if (typeof b === 'object' && b && typeof o === 'object' && o) out[key] = deepMerge(b, o);
		else out[key] = o;
	}
	return out;
}

function loadSecurity(defaults) {
	try {
		ensureStore();
		const raw = fs.readFileSync(STORE_PATH, 'utf8');
		const saved = JSON.parse(raw || '{}');
		return deepMerge(defaults, saved || {});
	} catch {
		return { ...defaults };
	}
}

function saveSecurity(security) {
	ensureStore();
	fs.writeFileSync(STORE_PATH, JSON.stringify(security, null, 2));
}

function updateSecurity(current, partial) {
	const updated = deepMerge(current, partial);
	saveSecurity(updated);
	return updated;
}

module.exports = { loadSecurity, saveSecurity, updateSecurity, deepMerge };
