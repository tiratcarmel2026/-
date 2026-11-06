/*
 * אינדקס עסקים — טירת כרמל
 * --------------------------------------------------------------
 * קובץ הנתונים של האינדקס. כל הרשומות כאן הן נתוני דוגמה בלבד
 * (שמות, טלפונים וכתובות פיקטיביים) לצורך הסקיצה.
 * בהמשך יוחלפו בנתוני העסקים האמיתיים.
 *
 * מבנה רשומה:
 *   id        מזהה באנגלית (משמש לקישור ישיר: #biz-<id>)
 *   name      שם העסק
 *   cat       מזהה קטגוריה (ראו CATEGORIES)
 *   area      אזור בעיר
 *   desc      תיאור קצר
 *   address   כתובת (משמשת גם לניווט בגוגל ובוויז)
 *   phone     טלפון לתצוגה
 *   whatsapp  מספר בפורמט בינלאומי ללא + (למשל 972501234567), או null
 *   email     כתובת מייל, או null
 *   website   אתר, או null
 *   social    { facebook, instagram, tiktok } — כל שדה אופציונלי
 *   hours     שעות פעילות לפי יום: 0=ראשון ... 6=שבת.
 *             כל יום הוא מערך של טווחים [["08:00","13:00"],["16:00","19:00"]]
 *             או null כשהעסק סגור.
 *   tags      תגיות חופשיות (משלוחים, נגיש, חניה...)
 */

window.TRACKS = {
  shops: { label: 'Shops בעיר', he: 'מסחר וקמעונאות', color: 'magenta' },
  biz:   { label: 'Biz בעיר',   he: 'עסקים ושירותים', color: 'blue' },
  space: { label: 'Space בעיר', he: 'מתחמים וחללי עבודה', color: 'green' }
};

window.CATEGORIES = [
  { id: 'food',     label: 'מסעדות ובתי קפה',   track: 'shops' },
  { id: 'grocery',  label: 'מזון ומכולת',        track: 'shops' },
  { id: 'retail',   label: 'אופנה וקניות',       track: 'shops' },
  { id: 'beauty',   label: 'יופי וטיפוח',        track: 'biz' },
  { id: 'health',   label: 'בריאות ורפואה',      track: 'biz' },
  { id: 'pro',      label: 'שירותים מקצועיים',   track: 'biz' },
  { id: 'auto',     label: 'רכב ומוסכים',        track: 'biz' },
  { id: 'home',     label: 'בית ושיפוצים',       track: 'biz' },
  { id: 'edu',      label: 'חינוך וחוגים',       track: 'biz' },
  { id: 'cowork',   label: 'חללי עבודה',         track: 'space' },
  { id: 'industry', label: 'תעשייה ולוגיסטיקה',  track: 'space' }
];

window.AREAS = ['מרכז העיר', 'אזור התעשייה', 'שכונות צפון', 'שכונות דרום'];

var WEEK = function (sunThu, fri, sat) {
  return [sunThu, sunThu, sunThu, sunThu, sunThu, fri || null, sat || null];
};

window.BUSINESSES = [
  {
    id: 'cafe-carmel', name: 'קפה הכרמל', cat: 'food', area: 'מרכז העיר',
    desc: 'בית קפה שכונתי עם מאפים טריים מהתנור, ארוחות בוקר ופינת עבודה שקטה.',
    address: 'רחוב הרצל 12, טירת כרמל', phone: '04-8570101', whatsapp: '972500000101',
    email: 'hello@cafe-carmel.example', website: 'https://cafe-carmel.example',
    social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/' },
    hours: WEEK([['07:00', '22:00']], [['07:00', '15:00']], [['09:00', '22:00']]),
    tags: ['כשר', 'ישיבה בחוץ', 'Wi-Fi']
  },
  {
    id: 'shawarma-yam', name: 'שווארמה בין כרמל לים', cat: 'food', area: 'שכונות דרום',
    desc: 'שווארמה על הגחלים, סלטים ביתיים ומשלוחים לכל העיר.',
    address: 'שדרות ההגנה 40, טירת כרמל', phone: '04-8570102', whatsapp: '972500000102',
    email: null, website: null,
    social: { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/' },
    hours: WEEK([['11:00', '23:30']], [['11:00', '15:00']], [['20:00', '23:59']]),
    tags: ['משלוחים', 'כשר']
  },
  {
    id: 'makolet-hagefen', name: 'מכולת הגפן', cat: 'grocery', area: 'שכונות צפון',
    desc: 'מכולת שכונתית עם ירקות טריים, מעדנייה וקופה מהירה.',
    address: 'רחוב הגפן 3, טירת כרמל', phone: '04-8570103', whatsapp: '972500000103',
    email: 'hagefen@example.com', website: null,
    social: { facebook: 'https://facebook.com/' },
    hours: WEEK([['06:30', '21:00']], [['06:30', '15:00']], null),
    tags: ['משלוחים', 'נגיש']
  },
  {
    id: 'ofna-tal', name: 'בוטיק טל', cat: 'retail', area: 'מרכז העיר',
    desc: 'אופנת נשים, אקססוריז ותיקים. קולקציות חדשות בכל עונה.',
    address: 'רחוב ז׳בוטינסקי 8, טירת כרמל', phone: '04-8570104', whatsapp: '972500000104',
    email: 'tal@boutique.example', website: 'https://boutique-tal.example',
    social: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/' },
    hours: WEEK([['09:30', '13:30'], ['16:30', '20:00']], [['09:30', '14:00']], null),
    tags: ['קניות אונליין']
  },
  {
    id: 'sport-plus', name: 'ספורט פלוס', cat: 'retail', area: 'אזור התעשייה',
    desc: 'ציוד ספורט, אופניים ונעלי ריצה. מעבדת אופניים במקום.',
    address: 'רחוב הנפח 5, אזור התעשייה טירת כרמל', phone: '04-8570105', whatsapp: '972500000105',
    email: 'shop@sportplus.example', website: 'https://sportplus.example',
    social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/' },
    hours: WEEK([['09:00', '19:00']], [['09:00', '14:00']], null),
    tags: ['חניה', 'נגיש']
  },
  {
    id: 'studio-noa', name: 'סטודיו נועה — שיער ויופי', cat: 'beauty', area: 'מרכז העיר',
    desc: 'תספורות, צבע, החלקות ואיפור לאירועים. תיאום תורים בווטסאפ.',
    address: 'רחוב הרצל 27, טירת כרמל', phone: '04-8570106', whatsapp: '972500000106',
    email: null, website: null,
    social: { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/' },
    hours: WEEK([['09:00', '19:00']], [['08:00', '14:00']], null),
    tags: ['בתיאום מראש']
  },
  {
    id: 'pharm-carmel', name: 'בית מרקחת כרמל', cat: 'health', area: 'מרכז העיר',
    desc: 'בית מרקחת עם רוקח זמין, מוצרי טיפוח ומשלוח תרופות עד הבית.',
    address: 'רחוב העצמאות 15, טירת כרמל', phone: '04-8570107', whatsapp: '972500000107',
    email: 'pharm@example.com', website: null,
    social: { facebook: 'https://facebook.com/' },
    hours: WEEK([['08:00', '20:00']], [['08:00', '14:00']], null),
    tags: ['משלוחים', 'נגיש', 'חניה']
  },
  {
    id: 'physio-move', name: 'מוב — פיזיותרפיה', cat: 'health', area: 'שכונות צפון',
    desc: 'מכון פיזיותרפיה לספורטאים, שיקום אחרי ניתוח וטיפול בכאבי גב.',
    address: 'רחוב יהודה הנשיא 4, טירת כרמל', phone: '04-8570108', whatsapp: '972500000108',
    email: 'clinic@move.example', website: 'https://move-physio.example',
    social: { instagram: 'https://instagram.com/' },
    hours: WEEK([['08:00', '13:00'], ['15:00', '20:00']], null, null),
    tags: ['בתיאום מראש', 'נגיש']
  },
  {
    id: 'cpa-levi', name: 'לוי ושות׳ — רואי חשבון', cat: 'pro', area: 'אזור התעשייה',
    desc: 'הנהלת חשבונות, דוחות שנתיים וליווי עסקים קטנים בפתיחת עסק.',
    address: 'רחוב הנפח 12, אזור התעשייה טירת כרמל', phone: '04-8570109', whatsapp: null,
    email: 'office@levi-cpa.example', website: 'https://levi-cpa.example',
    social: { facebook: 'https://facebook.com/' },
    hours: WEEK([['08:30', '17:00']], null, null),
    tags: ['ליווי עסקים']
  },
  {
    id: 'law-amar', name: 'משרד עו״ד עמר', cat: 'pro', area: 'מרכז העיר',
    desc: 'מקרקעין, צוואות וירושות, דיני עבודה. פגישת היכרות ללא עלות.',
    address: 'רחוב הרצל 33, טירת כרמל', phone: '04-8570110', whatsapp: '972500000110',
    email: 'amar@law.example', website: null,
    social: {},
    hours: WEEK([['09:00', '18:00']], null, null),
    tags: ['בתיאום מראש']
  },
  {
    id: 'garage-hof', name: 'מוסך החוף', cat: 'auto', area: 'אזור התעשייה',
    desc: 'מוסך מורשה לכל סוגי הרכב, טסטים, פנצ׳רייה ומיזוג אוויר.',
    address: 'רחוב המלאכה 9, אזור התעשייה טירת כרמל', phone: '04-8570111', whatsapp: '972500000111',
    email: 'service@garage-hof.example', website: null,
    social: { facebook: 'https://facebook.com/' },
    hours: WEEK([['07:30', '17:00']], [['07:30', '12:00']], null),
    tags: ['חניה']
  },
  {
    id: 'shiputzim-ben', name: 'בן — שיפוצים ואינסטלציה', cat: 'home', area: 'שכונות דרום',
    desc: 'שיפוצים כלליים, אינסטלציה ואיטום. הצעת מחיר בווטסאפ תוך יום.',
    address: 'רחוב הדקל 21, טירת כרמל', phone: '050-0000112', whatsapp: '972500000112',
    email: null, website: null,
    social: { facebook: 'https://facebook.com/', tiktok: 'https://tiktok.com/' },
    hours: WEEK([['07:00', '18:00']], [['07:00', '12:00']], null),
    tags: ['שירות עד הבית']
  },
  {
    id: 'kids-robotics', name: 'רובוטיקה לילדים', cat: 'edu', area: 'שכונות צפון',
    desc: 'חוגי רובוטיקה, תכנות ומייקרים לגילאי 6–14. קבוצות קטנות.',
    address: 'רחוב הזית 2, טירת כרמל', phone: '04-8570113', whatsapp: '972500000113',
    email: 'info@robokids.example', website: 'https://robokids.example',
    social: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/' },
    hours: WEEK([['15:00', '20:00']], null, null),
    tags: ['חוגים', 'נגיש']
  },
  {
    id: 'hub-carmel', name: 'האב כרמל — חלל עבודה', cat: 'cowork', area: 'מרכז העיר',
    desc: 'עמדות עבודה גמישות, חדרי ישיבות ומשרדים קטנים ליזמים ועצמאים.',
    address: 'רחוב העצמאות 2, טירת כרמל', phone: '04-8570114', whatsapp: '972500000114',
    email: 'hub@carmel-hub.example', website: 'https://carmel-hub.example',
    social: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/' },
    hours: WEEK([['08:00', '22:00']], [['08:00', '14:00']], null),
    tags: ['Wi-Fi', 'חדרי ישיבות', 'חניה']
  },
  {
    id: 'logi-port', name: 'לוג׳י פורט', cat: 'industry', area: 'אזור התעשייה',
    desc: 'מחסנים לאחסון לטווח קצר וארוך, הפצה ושירותי שילוח לעסקים.',
    address: 'רחוב התעשייה 30, אזור התעשייה טירת כרמל', phone: '04-8570115', whatsapp: null,
    email: 'ops@logiport.example', website: 'https://logiport.example',
    social: {},
    hours: WEEK([['07:00', '17:00']], null, null),
    tags: ['B2B', 'חניה']
  },
  {
    id: 'mafia-bakery', name: 'מאפיית השכונה', cat: 'grocery', area: 'שכונות דרום',
    desc: 'לחמים, חלות ועוגות שמרים טריים כל בוקר. הזמנות לאירועים.',
    address: 'רחוב הדקל 4, טירת כרמל', phone: '04-8570116', whatsapp: '972500000116',
    email: null, website: null,
    social: { instagram: 'https://instagram.com/' },
    hours: WEEK([['06:00', '19:00']], [['05:30', '15:00']], null),
    tags: ['כשר', 'הזמנות לאירועים']
  },
  {
    id: 'yoga-yam', name: 'יוגה ים', cat: 'health', area: 'שכונות צפון',
    desc: 'סטודיו ליוגה ופילאטיס, שיעורי בוקר וערב ושיעור ניסיון חינם.',
    address: 'רחוב הזית 14, טירת כרמל', phone: '04-8570117', whatsapp: '972500000117',
    email: 'namaste@yogayam.example', website: null,
    social: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/' },
    hours: WEEK([['07:00', '10:00'], ['17:00', '21:30']], [['08:00', '11:00']], null),
    tags: ['שיעור ניסיון']
  },
  {
    id: 'print-pro', name: 'דפוס פרו', cat: 'pro', area: 'אזור התעשייה',
    desc: 'דפוס דיגיטלי, שילוט לעסקים, כרטיסי ביקור ומיתוג רכבים.',
    address: 'רחוב המלאכה 17, אזור התעשייה טירת כרמל', phone: '04-8570118', whatsapp: '972500000118',
    email: 'print@printpro.example', website: 'https://printpro.example',
    social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/' },
    hours: WEEK([['08:00', '18:00']], [['08:00', '12:00']], null),
    tags: ['B2B', 'עבודה בהזמנה']
  }
];
