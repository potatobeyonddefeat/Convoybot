function timestamp() {
	return new Date().toISOString();
}

function createLogger(level = 'info') {
	const levels = ['error', 'warn', 'info', 'debug'];
	const currentIdx = levels.indexOf(level);

	function shouldLog(lvl) {
		return levels.indexOf(lvl) <= currentIdx;
	}

	return {
		info: (...args) => shouldLog('info') && console.log(`[${timestamp()}] [INFO]`, ...args),
		warn: (...args) => shouldLog('warn') && console.warn(`[${timestamp()}] [WARN]`, ...args),
		error: (...args) => shouldLog('error') && console.error(`[${timestamp()}] [ERROR]`, ...args),
		debug: (...args) => shouldLog('debug') && console.debug(`[${timestamp()}] [DEBUG]`, ...args),
	};
}

module.exports = { createLogger };
