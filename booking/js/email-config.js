/*
 * הגדרות שליחת מייל אוטומטית דרך EmailJS (https://www.emailjs.com).
 * EmailJS מאפשר לשלוח מיילים ישירות מהדפדפן, בלי שרת - מתאים בדיוק
 * למערכת סטטית כמו זו. יש חשבון חינמי (עד 200 מיילים בחודש).
 *
 * הוראות הגדרה מלאות ב-booking/README.md, סעיף "הפעלת שליחת מיילים".
 *
 * כל עוד enabled=false, המערכת עדיין עובדת במלואה - היא רק תציג לתושב
 * קישור מוכן לשליחת מייל ידנית (mailto) במקום לשלוח אוטומטית.
 */

window.TC_EMAILJS_CONFIG = {
  enabled: false,
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  departmentTemplateId: 'YOUR_EMAILJS_DEPARTMENT_TEMPLATE_ID',
  citizenTemplateId: 'YOUR_EMAILJS_CITIZEN_TEMPLATE_ID'
};
