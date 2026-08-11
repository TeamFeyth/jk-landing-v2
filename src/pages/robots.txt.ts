import type { APIRoute } from 'astro';
import { ALLOW_INDEXING } from '../lib/env';

export const GET: APIRoute = () => {
  const body = ALLOW_INDEXING
    ? 'User-agent: *\nAllow: /\n'
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
