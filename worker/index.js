// Exodus (the merged 2026 rankings) is built and published by its own repo, nicolagalassi/ogame-exodus,
// on GitHub Pages every 3 hours. It is shown here under /fusion/ through this proxy, so its data
// refreshes never cost an OValue build. Static assets cannot proxy an external origin, hence the Worker.
// /fusion and /fusion/ are both proxied: the Exodus page adds the missing slash itself (its data paths
// are relative), so a /fusion -> /fusion/ redirect is not needed.
const EXODUS = 'https://nicolagalassi.github.io/ogame-exodus/';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === '/fusion' || url.pathname.startsWith('/fusion/')) {
			const rest = url.pathname.slice('/fusion'.length).replace(/^\//, '');
			return fetch(EXODUS + rest + url.search, { method: request.method });
		}
		return env.ASSETS.fetch(request);
	},
};
