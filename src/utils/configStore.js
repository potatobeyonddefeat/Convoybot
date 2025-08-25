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

function readAll() {
	try {
		ensureStore();
		const raw = fs.readFileSync(STORE_PATH, 'utf8');
		return JSON.parse(raw || '{}');
	} catch {
		return {};
	}
}

function writeAll(obj) {
	ensureStore();
	fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2));
}

function sectionLoad(defaults, key) {
	const all = readAll();
	return deepMerge(defaults, all[key] || {});
}
function sectionSave(value, key) {
	const all = readAll();
	all[key] = value;
	writeAll(all);
}
function sectionUpdate(current, partial, key) {
	const updated = deepMerge(current, partial);
	sectionSave(updated, key);
	return updated;
}

const loadSecurity = (d) => sectionLoad(d, 'security');
const saveSecurity = (v) => sectionSave(v, 'security');
const updateSecurity = (c, p) => sectionUpdate(c, p, 'security');

const loadWelcome = (d) => sectionLoad(d, 'welcome');
const saveWelcome = (v) => sectionSave(v, 'welcome');
const updateWelcome = (c, p) => sectionUpdate(c, p, 'welcome');

const loadAppeals = (d) => sectionLoad(d, 'appeals');
const saveAppeals = (v) => sectionSave(v, 'appeals');
const updateAppeals = (c, p) => sectionUpdate(c, p, 'appeals');

const loadMemberCount = (d) => sectionLoad(d, 'memberCount');
const saveMemberCount = (v) => sectionSave(v, 'memberCount');
const updateMemberCount = (c, p) => sectionUpdate(c, p, 'memberCount');

module.exports = { loadSecurity, saveSecurity, updateSecurity, deepMerge, loadWelcome, saveWelcome, updateWelcome, loadAppeals, saveAppeals, updateAppeals, loadMemberCount, saveMemberCount, updateMemberCount };
