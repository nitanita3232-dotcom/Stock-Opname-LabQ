/**
 * Vercel serverless entry point for the Express API.
 *
 * Vercel's @vercel/node runtime wraps this exported Express app as a
 * serverless function and routes /api/* requests to it.
 *
 * Make sure DATABASE_URL (and SESSION_SECRET if you add auth) are set
 * in your Vercel project environment variables.
 */
// @ts-ignore
import app from '../artifacts/api-server/dist/index.mjs';

export default app;
