// Skyhitz API - Archived
// All functionality has been disabled due to a security vulnerability

const archivedResponse = {
	message: 'Skyhitz has been archived',
	reason: 'A vulnerability issue was exploited which compromised all of our HITZ supply.',
	warning: 'Please avoid trading the HITZ token (HITZ-GCAETBNBFKVGLYFXKCLMKT6ZVHFXHRSDFSEW7ODIUJYC6R7H2QJ6OKGU)',
	moreInfo: ['https://docs.skyhitz.io/', 'https://github.com/skyhitz/skyhitz'],
};

export default {
	async fetch(request: Request, env: Env, context: ExecutionContext) {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': '*',
				},
			});
		}

		// Return archived message for all requests
		return new Response(JSON.stringify(archivedResponse, null, 2), {
			status: 410, // Gone
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	},

	// Cron jobs disabled - do nothing
	async scheduled(controller: ScheduledController, env: Env, context: ExecutionContext) {
		console.log('Cron job triggered but API is archived - skipping all operations');
	},
};
