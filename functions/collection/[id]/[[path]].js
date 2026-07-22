export async function onRequest(context) {
  const { request, params, env } = context;
  const userAgent = request.headers.get('user-agent') || '';
  const collectionId = params.id;

  if (!isBot(userAgent)) {
    return env.ASSETS.fetch(request);
  }

  if (!collectionId || isNaN(collectionId)) {
    return env.ASSETS.fetch(request);
  }

  const requestUrl = new URL(request.url);
  const siteOrigin = requestUrl.origin;

  const rawApiHost = env.VITE_API_BASE_URL || env.API_BASE_URL || env.GO_API_HOST;

  if (!rawApiHost) {
    console.error('[Edge Worker] Missing API host configuration in Cloudflare environment variables.');
    return env.ASSETS.fetch(request);
  }

  const apiHost = rawApiHost.replace(/\/+$/, '');
  const apiUrl = `${apiHost}/collection/${collectionId}`;

  let meta = {
    title: 'Hobby Collection Showcase',
    description: 'Showcasing built model kits, custom paintwork, and third-party detail-up builds.',
    image: `${siteOrigin}/default-og-cover.png`,
    url: request.url,
  };

  try {
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Edge-Worker',
      },
    });

    if (apiRes.ok) {
      const responseData = await apiRes.json();
      
      const item = responseData.data || responseData;

      if (item) {
        meta.title = `${item.title || 'Collection Item'} | Hobby Showcase`;
        meta.description = item.description || meta.description;

        let rawImage = item.cover || (item.pictures && item.pictures[0]) || '';
        
        if (rawImage) {
          meta.image = (rawImage.startsWith('http://') || rawImage.startsWith('https://'))
            ? rawImage
            : `${siteOrigin}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
        }
      }
    } else {
      console.error(`[Edge Worker] API call failed: ${apiRes.status} ${apiRes.statusText} for URL ${apiUrl}`);
    }
  } catch (err) {
    console.error('[Edge Worker] Failed to fetch or parse API data:', err);
  }

  const indexResponse = await env.ASSETS.fetch(new URL('/', request.url));

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(meta.title);
      },
    })
    .on('head', {
      element(element) {
        element.append(`
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${escapeXml(meta.title)}" />
          <meta property="og:description" content="${escapeXml(meta.description)}" />
          <meta property="og:image" content="${escapeXml(meta.image)}" />
          <meta property="og:url" content="${escapeXml(meta.url)}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${escapeXml(meta.title)}" />
          <meta name="twitter:description" content="${escapeXml(meta.description)}" />
          <meta name="twitter:image" content="${escapeXml(meta.image)}" />
        `, { html: true });
      },
    })
    .transform(indexResponse);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const BOT_USER_AGENTS = [
    'discordbot',
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'telegrambot',
    'whatsapp',
    'metatags',
    'slackbot',
    'googlebot',
    'bingbot',
  ];
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}