// ספק דמו: מחזיר נתוני דוגמה קבועים (לא אמיתיים) כדי שהמערכת תעבוד קצה-לקצה
// עוד לפני שיש חיבור אמיתי לפייסבוק/אינסטגרם. להחלפה ב-facebookProvider.js
// ברגע שיש FB_PAGE_ID + FB_PAGE_ACCESS_TOKEN בקובץ .env.

const SAMPLE_POSTS = [
  {
    platform: 'facebook',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    text: 'מחר בערב מופע רחוב בכיכר העירייה במסגרת פסטיבל הקיץ 🎶',
    likeCount: 142,
    commentCount: 3,
  },
  {
    platform: 'instagram',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    text: 'תמונות מיום הניקיון השנתי בשכונת נאות שקמה 🧹🌳',
    likeCount: 310,
    commentCount: 2,
  },
];

const SAMPLE_COMMENTS = [
  {
    platform: 'facebook',
    postText: 'מחר בערב מופע רחוב בכיכר העירייה',
    author: 'תושבת אנונימית',
    text: 'יש חניה מסודרת לאירוע הזה? בפעם שעברה לא היה איפה לחנות',
    publishedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    url: 'https://facebook.com/example/posts/1',
  },
  {
    platform: 'facebook',
    postText: 'מחר בערב מופע רחוב בכיכר העירייה',
    author: 'משה כהן',
    text: 'איזה יופי, נגיע עם הילדים!',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    url: 'https://facebook.com/example/posts/1',
  },
  {
    platform: 'instagram',
    postText: 'יום הניקיון השנתי בשכונת נאות שקמה',
    author: 'resident_tc',
    text: 'התאורה ברחוב הרצל עדיין לא תוקנה כבר שבועיים, מסוכן בלילה',
    publishedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    url: 'https://instagram.com/p/example',
  },
];

export const mockProvider = {
  name: 'mock',
  async fetchRecentActivity() {
    return {
      source: 'mock',
      posts: SAMPLE_POSTS,
      comments: SAMPLE_COMMENTS,
    };
  },
};
