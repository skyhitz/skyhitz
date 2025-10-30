import { ApolloServer } from '@apollo/server';
import { CloudflareWorkersHandler, startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Context } from './util/types';

import { resolvers } from './graphql/resolvers';
import { Schema } from './graphql/schema';
import { authenticateUser } from './auth/auth-context';
import { handleWebhook } from './webhooks/stripe';
import { handleUpload } from './upload';
import { handleUploadAnalyze } from './upload-analyze';
import { handleUploadComplete } from './upload-complete';
import { runTreasuryBot } from './treasury/bot';

const server = new ApolloServer<Context>({
	typeDefs: Schema,
	resolvers,
	introspection: true,
	plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
});

let handler: CloudflareWorkersHandler<Env> = startServerAndCreateCloudflareWorkersHandler<Env, Context>(server, {
	context: authenticateUser,
});

export default {
	async fetch(request: Request, env: Env, context: ExecutionContext) {
		if (request.method === 'POST' && new URL(request.url).pathname === '/webhook') {
			return handleWebhook(request, env);
		}
		if (request.method === 'POST' && new URL(request.url).pathname === '/upload') {
			return handleUpload(request, env, context);
		}
		if (request.method === 'POST' && new URL(request.url).pathname === '/upload/analyze') {
			return handleUploadAnalyze(request, env, context);
		}
		if (request.method === 'POST' && new URL(request.url).pathname === '/upload/complete') {
			return handleUploadComplete(request, env, context);
		}
		// Manual treasury bot trigger for testing/debugging
		if (request.method === 'POST' && new URL(request.url).pathname === '/treasury-bot') {
			try {
				const result = await runTreasuryBot(env);
				return new Response(JSON.stringify(result, null, 2), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error: any) {
				return new Response(JSON.stringify({ 
					error: error?.message || 'Unknown error',
					stack: error?.stack 
				}, null, 2), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}
		let response = await handler(request, env, context);

		response = new Response(response.body, response);

		// Set CORS headers
		response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Specify allowed methods
		response.headers.set('Access-Control-Allow-Headers', '*');

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: response.headers,
			});
		}

		return response;
	},

	async scheduled(controller: ScheduledController, env: Env, context: ExecutionContext) {
		context.waitUntil(
			runTreasuryBot(env)
				.then((result) => {
					console.log('Treasury bot cron result', result);
				})
				.catch((error) => {
					console.error('Treasury bot cron failed', error);
				})
		);
	},
};
