/*
 * חישוב משבצות זמן פנויות למחלקה בתאריך נתון, לפי שעות הקבלה שהוגדרו
 * ב-departments-data.js. לא תלוי בשרת - כל החישוב מתבצע בדפדפן.
 */

window.TCScheduler = (function () {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function toHHMM(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // כל משבצות הזמן התיאורטיות ליום נתון (ללא סינון תפוסות/עבר)
  function slotsForDate(dept, date) {
    const dow = date.getDay();
    const windows = (dept.schedule || []).filter((w) => w.days.includes(dow));
    if (!windows.length) return [];
    const duration = dept.slotMinutes || 20;
    const set = new Set();
    windows.forEach((w) => {
      const start = toMinutes(w.start);
      const end = toMinutes(w.end);
      for (let t = start; t + duration <= end; t += duration) {
        set.add(toHHMM(t));
      }
    });
    return Array.from(set).sort();
  }

  // ימים קרובים (ברירת מחדל: 14) שיש בהם לפחות חלון קבלה אחד
  function upcomingOpenDates(dept, { daysAhead = 14, from = new Date() } = {}) {
    const result = [];
    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(from.getTime() + i * DAY_MS);
      d.setHours(0, 0, 0, 0);
      if (slotsForDate(dept, d).length) result.push(d);
    }
    return result;
  }

  // משבצות פנויות בפועל: מסנן זמן שכבר עבר (להיום) ותורים תפוסים/מוחזקים
  function availableSlots(dept, date, isTakenFn) {
    const all = slotsForDate(dept, date);
    const now = new Date();
    const isToday = dateKey(date) === dateKey(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return all.filter((hhmm) => {
      if (isToday && toMinutes(hhmm) <= nowMinutes) return false;
      if (isTakenFn && isTakenFn(hhmm)) return false;
      return true;
    });
  }

  return { dateKey, slotsForDate, upcomingOpenDates, availableSlots, toMinutes, toHHMM };
})();
