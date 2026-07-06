// ספק אמיתי דרך Meta Graph API (עמוד פייסבוק, ומכסה גם אינסטגרם עסקי
// אם מחובר לאותו עמוד). דורש FB_PAGE_ID + FB_PAGE_ACCESS_TOKEN ב-.env.
// הוראות קבלת טוקן: ראו README.md > "חיבור לרשתות חברתיות אמיתיות".

const GRAPH_VERSION = 'v19.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphGet(pathname, params) {
  const url = new URL(`${GRAPH_BASE}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Facebook Graph API error ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

export const facebookProvider = {
  name: 'facebook',
  async fetchRecentActivity() {
    const pageId = process.env.FB_PAGE_ID;
    const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;

    const postsResp = await graphGet(`/${pageId}/posts`, {
      fields: 'message,created_time,likes.summary(true),comments.summary(true)',
      limit: '10',
      access_token: accessToken,
    });

    const posts = (postsResp.data ?? []).map((p) => ({
      platform: 'facebook',
      publishedAt: p.created_time,
      text: p.message ?? '',
      likeCount: p.likes?.summary?.total_count ?? 0,
      commentCount: p.comments?.summary?.total_count ?? 0,
      id: p.id,
    }));

    const comments = [];
    for (const post of postsResp.data ?? []) {
      if (!post.comments?.summary?.total_count) continue;
      const commentsResp = await graphGet(`/${post.id}/comments`, {
        fields: 'message,from,created_time,permalink_url',
        limit: '20',
        access_token: accessToken,
      });
      for (const c of commentsResp.data ?? []) {
        comments.push({
          platform: 'facebook',
          postText: post.message ?? '',
          author: c.from?.name ?? 'לא ידוע',
          text: c.message ?? '',
          publishedAt: c.created_time,
          url: c.permalink_url,
        });
      }
    }

    return { source: 'facebook', posts, comments };
  },
};
