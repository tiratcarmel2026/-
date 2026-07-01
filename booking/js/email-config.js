/*
 * הגדרות שליחת מייל אוטומטית דרך EmailJS (https://www.emailjs.com).
 * EmailJS שולח מייל ישירות מהדפדפן, בלי שרת ובלי חברת SMS/שירות תשלום -
 * מתאים בדיוק למערכת סטטית כמו זו. חשבון חינמי, עד 200 מיילים בחודש,
 * מחובר לתיבת המייל שלכם (Gmail/Outlook וכו').
 *
 * הוראות הגדרה מלאות (3 דקות) ב-booking/README.md, סעיף "הפעלת שליחת מיילים".
 *
 * כל עוד enabled=false, המערכת עדיין עובדת במלואה - היא רק תציג לתושב
 * קישור מוכן לשליחת מייל ידנית (mailto) במקום לשלוח אוטומטית.
 */

window.TC_EMAILJS_CONFIG = {
  enabled: false,
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID'
};
