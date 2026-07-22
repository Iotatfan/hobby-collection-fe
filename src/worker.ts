import type { ICollection } from '@/libs/collection/collection';

interface Env {
  ASSETS: Fetcher;
  VITE_API_BASE_URL?: string;
  API_BASE_URL?: string;
  GO_API_HOST?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') ?? '';

    // Let non-collection routes behave normally.
    const match = url.pathname.match(/^\/collection\/(\d+)(?:\/.*)?$/);
    if (!match) {
      return env.ASSETS.fetch(request);
    }

    // Only rewrite HTML for bots.
    if (!isBot(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    const collectionId = Number(match[1]);
    if (!Number.isSafeInteger(collectionId)) {
      return env.ASSETS.fetch(request);
    }

    // Safely get API host with fallback
    const rawApiHost =
      import.meta.env?.VITE_API_BASE_URL ??
      env.VITE_API_BASE_URL
    
    const cloudinary = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME

    if (!rawApiHost) {
      console.error('[Worker] Missing API host configuration.');
      return env.ASSETS.fetch(request);
    }

    const apiHost = rawApiHost.replace(/\/+$/, '');
    const apiUrl = `${apiHost}/collection/${collectionId}`;

    const meta = {
      title: 'Hobby Collection Showcase',
      description: 'Showcasing built model kits, custom paintwork, and third-party detail-up builds.',
      image: `${url.origin}/default-og-cover.png`,
      url: request.url,
    };

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Cloudflare-Worker',
        },
      });

      if (apiRes.ok) {
        const response = (await apiRes.json()) as ApiResponse<ICollection>;
        const item = response.data;

        meta.title = `${item.title ?? 'Collection Item'} | Hobby Showcase`;
        
        // Clean up multiline breaks that confuse parsers
        if (item.description) {
          meta.description = item.description.replace(/\s+/g, ' ').trim();
        }

        const image = item.cover ?? (item.pictures?.length ? item.pictures[0] : '');

        if (typeof image === 'string' && image.length > 0) {
          if (image.startsWith('http://') || image.startsWith('https://')) {
            meta.image = image;
          } else {
            // Check if it's a relative Cloudinary path vs local static asset path
            const isCloudinaryPath = image.startsWith('v') || image.includes('Hobby/');
            if (isCloudinaryPath) {
              meta.image = `https://res.cloudinary.com/${cloudinary}/image/upload/${image.replace(/^\//, '')}`;
            } else {
              meta.image = `${url.origin}${image.startsWith('/') ? '' : '/'}${image}`;
            }
          }
        }
      } else {
        console.warn(`[Worker] API returned ${apiRes.status}`);
      }
    } catch (err) {
      console.error('[Worker]', err);
    }

    // Fetch SPA index.html from Static Assets
    const response = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('text/html')) {
      return response;
    }

    // Overwrite existing meta tags in-place rather than appending new ones
    return new HTMLRewriter()
      .on('title', {
        element(el) { el.setInnerContent(meta.title); }
      })
      .on('meta[property="og:title"]', {
        element(el) { el.setAttribute('content', meta.title); }
      })
      .on('meta[property="og:description"]', {
        element(el) { el.setAttribute('content', meta.description); }
      })
      .on('meta[property="og:image"]', {
        element(el) { el.setAttribute('content', meta.image); }
      })
      .on('meta[property="og:url"]', {
        element(el) { el.setAttribute('content', meta.url); }
      })
      .on('meta[name="twitter:title"]', {
        element(el) { el.setAttribute('content', meta.title); }
      })
      .on('meta[name="twitter:description"]', {
        element(el) { el.setAttribute('content', meta.description); }
      })
      .on('meta[name="twitter:image"]', {
        element(el) { el.setAttribute('content', meta.image); }
      })
      .transform(response);
  },
};

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return [
    'discordbot',
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'telegrambot',
    'whatsapp',
    'slackbot',
    'metatags',
    'googlebot',
    'google-inspectiontool',
    'bingbot',
    'duckduckbot',
    'applebot',
    'bytespider',
    'petalbot',
  ].some((bot) => ua.includes(bot));
}