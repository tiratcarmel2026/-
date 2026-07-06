import { mockProvider } from './mockProvider.js';
import { facebookProvider } from './facebookProvider.js';

export function getSocialProvider() {
  const hasFacebookCreds = Boolean(
    process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN
  );
  if (hasFacebookCreds) return facebookProvider;

  console.warn(
    '[social] FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN לא מוגדרים — עובד במצב דמו (mock data).'
  );
  return mockProvider;
}
