/*
 * נתוני המחלקות והשירותים של עיריית טירת כרמל.
 * זהו קובץ הקונפיגורציה היחיד שצריך לערוך כדי לעדכן מחלקות, כתובות,
 * טלפונים, מיילים ושעות קבלת קהל - אין צורך לגעת בשאר הקוד.
 *
 * ימים: 0=ראשון, 1=שני, 2=שלישי, 3=רביעי, 4=חמישי, 5=שישי, 6=שבת
 *
 * שדות בכל מחלקה:
 *   id                      - מזהה ייחודי (אנגלית, ללא רווחים)
 *   name                    - שם המחלקה כפי שיוצג לתושב
 *   address                 - כתובת (או '' אם לא ידועה)
 *   phones                  - מערך מספרי טלפון
 *   email                   - מייל ליצירת קשר (או '' אם אין)
 *   schedule                - מערך חלונות קבלת קהל: [{days:[...], start:'HH:MM', end:'HH:MM'}]
 *                             מערך ריק = אין שעות קבועות (למשל "לפי תיאום מראש" בלבד)
 *   slotMinutes             - אורך כל משבצת פגישה בדקות
 *   onlineBookingAvailable  - האם ניתן לקבוע תור אונליין (false = הצגת פרטי קשר בלבד)
 *   note                    - הערה חופשית שתוצג לתושב
 *   contacts                - (אופציונלי) רשימת אנשי קשר בתוך המחלקה, לבחירה לפני התור
 */

window.TC_DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;
const SUN_THU = [SUN, MON, TUE, WED, THU];

window.TC_MUNICIPALITY_SWITCHBOARD = '04-8547000';

window.TC_DEPARTMENTS = [
  {
    id: 'mayor-office',
    name: "לשכת ראש העיר",
    address: 'הרצל 6',
    phones: ['04-8547021'],
    email: '',
    schedule: [],
    slotMinutes: 20,
    onlineBookingAvailable: false,
    note: 'קבלת קהל לפי תיאום מראש בלבד - יש ליצור קשר טלפוני עם הלשכה.'
  },
  {
    id: 'municipality-offices',
    name: 'משרדי העירייה',
    address: 'הרצל 6',
    phones: ['04-8547000'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '12:30' },
      { days: [MON], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 15,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'collections',
    name: "מח' גבייה (ארנונה)",
    address: 'הרצל 6',
    phones: ['04-8547046', '04-8547047'],
    email: 'arnona@tirat-carmel.muni.il',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '12:30' }
    ],
    slotMinutes: 15,
    onlineBookingAvailable: true,
    note: 'מענה טלפוני נוסף בימים א׳-ה׳ בין השעות 13:00-14:30.'
  },
  {
    id: 'engineering',
    name: "מח' הנדסה",
    address: 'מוצקין 15',
    phones: ['04-8572460'],
    email: 'inbalp@tirat-carmel.muni.il',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '12:30' },
      { days: [MON], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 15,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'city-appearance',
    name: "מח' חזות העיר",
    address: 'מוצקין 15',
    phones: ['04-8576138'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '12:30' },
      { days: [MON], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 15,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'vet',
    name: 'וטרינר עירוני',
    address: 'מוצקין 15א, כניסה מסביב לבניין (הכניסה ליד מד"א)',
    phones: ['04-7708256'],
    email: 'vet@tirat-carmel.muni.il',
    schedule: [],
    slotMinutes: 20,
    onlineBookingAvailable: false,
    note: 'שעות הפעילות שנמסרו (יום א׳: 15:00-08:00, יום ב׳: 18:00-12:00, יום ד׳: 15:00-08:00) אינן תקינות במקור וזקוקות לאימות מול הווטרינריה לפני הפעלת קביעת תור אונליין. בינתיים ניתן ליצור קשר טלפוני או במייל.'
  },
  {
    id: 'social-services',
    name: 'המחלקה לשירותים חברתיים',
    address: 'ויצמן 71',
    phones: ['04-8573232'],
    email: '',
    schedule: [
      { days: [SUN, TUE, WED, THU], start: '08:00', end: '14:00' },
      { days: [MON], start: '08:00', end: '13:00' },
      { days: [MON], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 30,
    onlineBookingAvailable: true,
    note: 'יש לתאם מראש.'
  },
  {
    id: 'shil',
    name: "ש.י.ל (שירות ייעוץ לאזרח)",
    address: "ז'בוטינסקי 41 (ליד הכניסה למתנ\"ס)",
    phones: ['04-8576522'],
    email: '',
    schedule: [
      { days: [SUN], start: '09:00', end: '13:00' },
      { days: [MON], start: '11:00', end: '14:00' },
      { days: [TUE], start: '09:00', end: '13:00' },
      { days: [WED], start: '09:00', end: '13:00' }
    ],
    slotMinutes: 30,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'library',
    name: 'ספרייה עירונית',
    address: 'פלמ"ח 6',
    phones: ['04-8574860'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '10:00', end: '14:00' },
      { days: [SUN, MON, WED, THU], start: '15:30', end: '19:30' }
    ],
    slotMinutes: 20,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'youth-human-capital',
    name: 'מרכז צעירים והון אנושי',
    address: 'אלמוג 14',
    phones: ['04-8581406'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '19:00' }
    ],
    slotMinutes: 30,
    onlineBookingAvailable: true,
    note: 'בתיאום מראש.'
  },
  {
    id: 'youth-center',
    name: 'מרכז הנוער',
    address: 'כרמלים 6',
    phones: ['04-8570425'],
    schedule: [
      { days: SUN_THU, start: '08:00', end: '20:00' }
    ],
    slotMinutes: 20,
    onlineBookingAvailable: true,
    note: 'בימים א׳-ג׳ קיימת גם קבלה ייעודית בשעות 9:00-12:00.'
  },
  {
    id: 'lilach-center',
    name: 'מרכז לילך',
    address: '',
    phones: ['04-8570425'],
    email: '',
    schedule: [
      { days: [MON, WED], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 20,
    onlineBookingAvailable: true,
    note: 'כתובת המרכז לא נמסרה - יש להשלים בקובץ הקונפיגורציה.'
  },
  {
    id: 'employment-center',
    name: 'מרכז התעסוקה',
    address: "ז'בוטינסקי 11",
    phones: ['04-8707927'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:30', end: '13:00' },
      { days: [MON, WED], start: '13:00', end: '14:00' }
    ],
    slotMinutes: 30,
    onlineBookingAvailable: true,
    note: 'מענה טלפוני בימים א׳-ה׳ בין השעות 8:00-16:00.'
  },
  {
    id: 'religious-council',
    name: 'המועצה הדתית',
    address: 'עמידר 19',
    phones: ['04-8570242'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '13:00' },
      { days: [MON], start: '16:00', end: '18:30' }
    ],
    slotMinutes: 15,
    onlineBookingAvailable: true,
    note: ''
  },
  {
    id: 'education',
    name: 'אגף החינוך',
    address: '',
    phones: ['04-8547016'],
    email: '',
    schedule: [
      { days: SUN_THU, start: '08:00', end: '12:30' },
      { days: [MON], start: '16:00', end: '18:00' }
    ],
    slotMinutes: 20,
    onlineBookingAvailable: true,
    note: 'שעות ברירת מחדל בהתאם לשעות הקבלה הכלליות של העירייה - יש לוודא מול מזכירות האגף ולעדכן במידת הצורך. יש לבחור איש/אשת קשר לפני קביעת התור.',
    contacts: [
      { name: 'דני פסלר', role: 'ראש אגף החינוך', phones: ['04-8547016'], email: 'DanF@tirat-carmel.muni.il' },
      { name: 'ציון סודרי', role: 'סגן מנהל אגף חינוך', phones: ['04-8547016', '04-8576698'], email: 'zion_s@tirat-carmel.muni.il' },
      { name: 'אירית זליג', role: "מנהלת בתי ספר יסודיים/על יסודיים", phones: ['04-8146766', '04-8576698'], email: 'iritz@tirat-carmel.muni.il' },
      { name: 'אורלי לייש', role: 'מנהלת גני ילדים', phones: ['04-8547002'], email: 'OrlyL@tirat-carmel.muni.il' },
      { name: 'אילנה פיצחדזה', role: 'מנהלת לשכת מנהל אגף החינוך', phones: ['04-8547027', '04-8576698'], email: 'ilanap@tirat-carmel.muni.il' },
      { name: 'עדנה אסולין', role: 'רכזת רישום', phones: ['04-8146763', '04-8576698'], email: 'EdnaA@tirat-carmel.muni.il' },
      { name: 'לימור הרמן', role: 'רכזת קצינות ביקור סדיר', phones: ['04-8547045', '04-8576698'], email: 'limorh@tirat-carmel.muni.il' },
      { name: 'רעות חדש', role: 'רכזת צהרונים', phones: ['04-8146762'], email: 'ReutH@tirat-carmel.muni.il' },
      { name: 'מירב דהן', role: 'רכזת הסעות וסייעות צמודות', phones: ['04-8547044', '04-8576698'], email: 'meravd@tirat-carmel.muni.il' },
      { name: 'שרון ליבוביץ', role: 'רכזת חינוך מיוחד', phones: ['04-8146764'], email: 'SharonL@tirat-carmel.muni.il' },
      { name: 'זהבה עובדיה', role: 'מנהלת לידה עד שלוש', phones: ['054-4571573'], email: 'ZahavaO@tirat-carmel.muni.il' },
      { name: 'אליה לוי', role: 'מזכירת גני ילדים', phones: ['04-8547028'], email: 'EliaL@tirat-carmel.muni.il' },
      { name: 'חגית ליברמן', role: '', phones: ['04-8547066'], email: 'hagitlib@tirat-carmel.muni.il' },
      { name: "חנית צ'ובן כהן", role: 'מזכירת הסעות וסייעות בתי ספר', phones: ['04-8146761'], email: 'hanitc@tirat-carmel.muni.il' },
      { name: 'לינוי רז מירו', role: 'מזכירת חינוך מיוחד', phones: ['04-8146765'], email: 'linoyr@tirat-carmel.muni.il' },
      { name: 'ענת טואבה מלסה', role: 'קב"סית', phones: ['04-8547003'], email: 'ekulnettm@tirat-carmel.muni.il' },
      { name: 'חוה גרובר', role: 'קב"סית', phones: ['04-8547019'], email: 'hava@tirat-carmel.muni.il' },
      { name: 'טל לייזרוביץ', role: 'חשב אגף', phones: ['04-8146762'], email: 'tal_L@tirat-carmel.muni.il' },
      { name: 'טל ששון', role: 'מנהל מרכז הנוער', phones: ['04-6108790'], email: 'tals@tirat-carmel.muni.il' }
    ]
  }
];
