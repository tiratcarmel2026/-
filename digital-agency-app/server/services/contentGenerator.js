import { callClaude } from './anthropic.js';
import { getSocialProvider } from './socialProviders/index.js';

const SYSTEM_PROMPT = `את/ה עובד/ת התוכן הדיגיטלי הקבוע/ה של עיריית טירת כרמל.
התפקיד שלך: כל שעה עגולה להכין תוכן דיגיטלי מוכן לפרסום ולסכם מה חשוב לדעת
מהרשתות החברתיות של העירייה.

הנחיות טון וסגנון:
- עברית תקנית, ידידותית, בגובה העיניים, בלי סופרלטיבים מוגזמים.
- מותאם לתושבי עיר בגודל בינוני (טירת כרמל, מחוז חיפה).
- פלטת הצבעים של העירייה: כתום #F47B20, כחול #1B4D89, ירוק #3AA935, לבן.
- אסור להמציא עובדות, תאריכים, שמות אנשי ציבור או אירועים אמיתיים —
  כשאין מידע אמיתי, יש לכתוב תוכן גנרי/עונתי (חגים, עונות שנה, נושאי אחזקה
  עירונית כלליים) ולסמן זאת בבירור כרעיון גנרי.
- החזר/י אך ורק JSON תקני, בלי טקסט נוסף לפני או אחרי, בפורמט הבא:

{
  "postIdeas": [
    {
      "platform": "facebook | instagram | general",
      "title": "string",
      "captionText": "string - טקסט מוכן לפרסום",
      "hashtags": ["string", "..."],
      "graphicPrompt": {
        "description": "string - תיאור ויזואלי מפורט בעברית לגרפיקאי/AI",
        "styleNotes": "string - צבעים, קומפוזיציה, פונט מוצע"
      }
    }
  ],
  "socialListening": {
    "trendSummary": "string - סיכום קצר של המגמות/הפעילות שסופקה",
    "flaggedComments": [
      {
        "platform": "string",
        "author": "string",
        "text": "string",
        "reason": "string - למה זה חשוב שהצוות ידע",
        "suggestedAction": "string"
      }
    ]
  }
}`;

function buildUserPrompt({ posts, comments, source }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', { timeZone: process.env.TZ || 'Asia/Jerusalem' });
  const timeStr = now.toLocaleTimeString('he-IL', { timeZone: process.env.TZ || 'Asia/Jerusalem' });

  return `התאריך והשעה כעת: ${dateStr}, ${timeStr}.

נתוני רשתות חברתיות אחרונים (מקור: ${source}${source === 'mock' ? ' — נתוני דוגמה, אין עדיין חיבור אמיתי לרשת חברתית' : ''}):

פוסטים אחרונים:
${posts.map((p, i) => `${i + 1}. [${p.platform}] "${p.text}" (לייקים: ${p.likeCount}, תגובות: ${p.commentCount})`).join('\n') || 'אין נתונים'}

תגובות אחרונות:
${comments.map((c, i) => `${i + 1}. [${c.platform}] ${c.author}: "${c.text}"`).join('\n') || 'אין נתונים'}

בהתבסס על הנתונים האלה (ואם אין מספיק נתונים - על תוכן גנרי/עונתי מתאים),
הכן/י:
1. 3 רעיונות לפוסטים חדשים לרשתות החברתיות של העירייה, עם טקסט מוכן לפרסום.
2. עבור כל רעיון - תיאור/פרומפט לגרפיקה שמתאימה לו.
3. סיכום קצר של מגמות מהתגובות שסופקו, ורשימת תגובות שחשוב שהצוות האנושי
   יראה וייתן עליהן את הדעת (תלונות, בעיות בטיחות, שאלות דחופות וכו').
   אם כל התגובות שגרתיות/חיוביות - אפשר להחזיר flaggedComments ריק ולציין זאת ב-trendSummary.

החזר/י אך ורק את אובייקט ה-JSON, ללא טקסט נוסף.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('לא נמצא JSON בתשובת המודל');
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function generateHourlyBatch() {
  const provider = getSocialProvider();
  const activity = await provider.fetchRecentActivity();

  const prompt = buildUserPrompt({
    posts: activity.posts,
    comments: activity.comments,
    source: activity.source,
  });

  const rawText = await callClaude({ system: SYSTEM_PROMPT, prompt });
  const parsed = extractJson(rawText);

  return {
    id: `batch_${Date.now()}`,
    createdAt: new Date().toISOString(),
    socialSource: activity.source,
    postIdeas: parsed.postIdeas ?? [],
    socialListening: parsed.socialListening ?? { trendSummary: '', flaggedComments: [] },
  };
}
