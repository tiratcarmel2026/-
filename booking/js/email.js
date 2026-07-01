/*
 * שליחת הודעות מייל על תור חדש - למחלקה ולתושב.
 * אם EmailJS מוגדר (email-config.js) נשלח מייל אמיתי אוטומטית.
 * אם לא, מוצג לתושב קישור mailto מוכן מראש כדי שיוכל לשלוח ידנית,
 * כך שלא הולך לאיבוד מידע גם בלי הגדרת שירות מייל.
 */

window.TCEmail = (function () {
  const cfg = window.TC_EMAILJS_CONFIG || { enabled: false };
  let initialized = false;

  function ensureInit() {
    if (!cfg.enabled || initialized) return;
    if (window.emailjs && cfg.publicKey) {
      window.emailjs.init({ publicKey: cfg.publicKey });
      initialized = true;
    }
  }

  function formatDate(dateKey) {
    const [y, m, d] = dateKey.split('-');
    return `${d}/${m}/${y}`;
  }

  function summaryText(booking, dept, contact) {
    const lines = [
      `מחלקה: ${dept.name}${contact ? ' - ' + contact.name : ''}`,
      `תאריך: ${formatDate(booking.dateKey)}`,
      `שעה: ${booking.time}`,
      `שם התושב/ת: ${booking.citizen.name}`,
      `טלפון: ${booking.citizen.phone}`,
      `אימייל: ${booking.citizen.email}`,
      booking.citizen.notes ? `הערות: ${booking.citizen.notes}` : null
    ].filter(Boolean);
    return lines.join('\n');
  }

  function mailtoLink(to, subject, body) {
    const params = new URLSearchParams({ subject, body });
    return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
  }

  // תבנית EmailJS יחידה, משותפת לשני סוגי המיילים (למחלקה ולתושב) -
  // מזערי ההגדרה לשלושה שדות בלבד: to_email, subject, message.
  async function sendViaEmailJS(templateParams) {
    ensureInit();
    if (!cfg.enabled || !initialized) return { sent: false, reason: 'not-configured' };
    try {
      await window.emailjs.send(cfg.serviceId, cfg.templateId, templateParams);
      return { sent: true };
    } catch (err) {
      console.error('EmailJS send failed', err);
      return { sent: false, reason: 'error', error: err };
    }
  }

  // מחזיר { departmentResult, citizenResult } - כל אחד עם sent:true/false
  // ובמידה ו-sent:false, mailto מוכן כגיבוי.
  async function notifyBooking(booking, dept, contact) {
    const recipientEmail = contact ? contact.email : dept.email;
    const recipientLabel = contact ? `${dept.name} - ${contact.name}` : dept.name;
    const summary = summaryText(booking, dept, contact);
    const dateStr = formatDate(booking.dateKey);

    const departmentSubject = `תור חדש: ${booking.citizen.name} - ${dateStr} ${booking.time}`;
    const departmentMessage = `התקבלה קביעת תור חדשה עבור ${recipientLabel}:\n\n${summary}`;

    const departmentResult = recipientEmail
      ? await sendViaEmailJS({ to_email: recipientEmail, subject: departmentSubject, message: departmentMessage })
      : { sent: false, reason: 'no-recipient' };

    if (!departmentResult.sent && recipientEmail) {
      departmentResult.mailto = mailtoLink(recipientEmail, departmentSubject, departmentMessage);
    }

    const citizenSubject = `אישור תור - ${recipientLabel}`;
    const citizenMessage = `שלום ${booking.citizen.name},\n\nהתור שלך נקבע בהצלחה:\n\n${summary}\n\nעיריית טירת כרמל`;

    const citizenResult = booking.citizen.email
      ? await sendViaEmailJS({ to_email: booking.citizen.email, subject: citizenSubject, message: citizenMessage })
      : { sent: false, reason: 'no-recipient' };

    if (!citizenResult.sent && booking.citizen.email) {
      citizenResult.mailto = mailtoLink(booking.citizen.email, citizenSubject, citizenMessage);
    }

    return { departmentResult, citizenResult };
  }

  // יצירת קובץ ICS להוספה ליומן, ללא כל תלות חיצונית
  function buildICS(booking, dept, contact) {
    const [y, m, d] = booking.dateKey.split('-').map(Number);
    const [h, min] = booking.time.split(':').map(Number);
    const start = new Date(y, m - 1, d, h, min);
    const end = new Date(start.getTime() + (dept.slotMinutes || 20) * 60000);
    const fmt = (dt) =>
      `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}T${String(
        dt.getHours()
      ).padStart(2, '0')}${String(dt.getMinutes()).padStart(2, '0')}00`;
    const title = `תור - ${dept.name}${contact ? ' (' + contact.name + ')' : ''}`;
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tirat Carmel Municipality//Booking//HE',
      'BEGIN:VEVENT',
      `UID:${booking.id}@tirat-carmel-booking`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${dept.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadICS(booking, dept, contact) {
    const ics = buildICS(booking, dept, contact);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tor-${booking.dateKey}-${booking.time.replace(':', '')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { notifyBooking, mailtoLink, downloadICS, isConfigured: () => !!cfg.enabled };
})();
