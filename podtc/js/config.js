/* podtc — settings the municipality can edit without touching the code. */
window.PODTC_CONFIG = {
  social: {
    // TikTok account of the municipality (without @). Embedded with TikTok's official "creator embed".
    tiktok: 'tiratcarmel.muni',
    // Optional: IDs of specific TikTok videos to feature (the number at the end of a video link,
    // e.g. https://www.tiktok.com/@user/video/7300000000000000000 → '7300000000000000000').
    // Single videos use TikTok's official player and always embed reliably.
    tiktokVideos: [],
    facebook: 'TCarmel.muni',
    youtubeChannel: 'UCeGhFSCGBTK18f_c3dQPQWg'
  },

  /* Municipal notices shown between the sections of the home page ("לוח המודעות").
     Edit freely: newest first. date = YYYY-MM-DD. Notices older than ~45 days get an "ארכיון" tag.
     Facebook does not allow reading a page's posts without the page owner's access token, so posts
     from the municipality's social networks are added here by the spokesperson's office. */
  notices: [
    { date: '2026-11-01', tag: 'מים וביוב', title: 'מי כרמל: אין לחבר מרזבים ומערכות לאיסוף מי גשם למערכת הביוב',
      text: 'לקראת החורף מזכיר תאגיד המים: חיבור מרזבים לביוב גורם להצפות. התאגיד מזהיר גם מפני מתחזים לעובדי החברה.', src: 'מי כרמל', url: 'https://www.mei-carmel.co.il/' },
    { date: '2026-10-20', tag: 'התחדשות עירונית', title: 'העירייה נערכת להמשך תנופת ההתחדשות העירונית',
      text: 'דיון בהשתתפות המינהלת להתחדשות עירונית ואגפי העירייה עסק בהיערכות התשתיות והשירותים לעיר שגדלה.', src: 'חי פה', url: 'https://haipo.co.il/item/649792' },
    { date: '2026-10-14', tag: 'תכנון ובנייה', title: 'הופקדה תוכנית ויצמן־ז\'בוטינסקי: 7 מגדלים וכ־1,200 דירות',
      text: 'הוועדה המחוזית אישרה להפקיד את התוכנית. לציבור יש זכות לעיין בה ולהגיש התנגדויות.', src: 'פאנדר', url: 'https://funder.co.il/article/211838', ep: 'weizmann-towers' },
    { date: '2026', tag: 'חינוך', title: 'טירת כרמל מצדיעה למצוינות: מלגות למצטייני העיר לשנת 2026',
      text: 'העירייה העניקה מלגות לתושבים מצטיינים.', src: 'חדשות 0404', url: 'https://0404.co.il/article/1182749' },
    { date: '2026', tag: 'קהילה', title: 'יקירי העיר לשנת 2026',
      text: 'העירייה הציגה את יקירי העיר, תושבים שתרמו לקהילה.', src: 'קול החוף', url: 'https://hoff.co.il/' }
  ],

  /* Photo gallery. Paste direct image links (for example photos the municipality uploaded to its
     site), newest first: { src: 'https://…jpg', caption: '…' }. While empty, the gallery section
     shows the municipality's Facebook feed and buttons to its photo albums. */
  gallery: []
};
