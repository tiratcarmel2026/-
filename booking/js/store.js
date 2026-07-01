/*
 * ניהול "החזקת" משבצת זמן ל-15 דקות ואישור תורים, בעזרת localStorage.
 *
 * חשוב: זהו אחסון מקומי בדפדפן בלבד. הוא מונע כפילות תור באותו מכשיר/דפדפן
 * ומדמה עבור התושב את חוויית "המשבצת שמורה לך ל-15 דקות", אבל אינו מסונכרן
 * בין מכשירים/תושבים שונים בזמן אמת. כדי למנוע קביעת אותה משבצת בפועל על ידי
 * שני תושבים שונים (כל אחד מהמחשב/טלפון שלו) יש צורך בשרת מרכזי - ראו
 * booking/README.md, סעיף "מגבלה אדריכלית חשובה".
 */

window.TCStore = (function () {
  const HOLDS_KEY = 'tc_booking_holds_v1';
  const BOOKINGS_KEY = 'tc_booking_confirmed_v1';
  const HOLD_DURATION_MS = 15 * 60 * 1000;

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function slotIdentity(deptId, dateKey, time, contactEmail) {
    return [deptId, dateKey, time, contactEmail || ''].join('|');
  }

  function cleanExpiredHolds() {
    const now = Date.now();
    const holds = read(HOLDS_KEY).filter((h) => h.expiresAt > now);
    write(HOLDS_KEY, holds);
    return holds;
  }

  function isSlotTaken(deptId, dateKey, time, contactEmail, excludeHoldId) {
    const identity = slotIdentity(deptId, dateKey, time, contactEmail);
    const holds = cleanExpiredHolds();
    const heldByOther = holds.some(
      (h) => h.id !== excludeHoldId && slotIdentity(h.deptId, h.dateKey, h.time, h.contactEmail) === identity
    );
    if (heldByOther) return true;
    const bookings = read(BOOKINGS_KEY);
    return bookings.some(
      (b) => b.status !== 'cancelled' && slotIdentity(b.deptId, b.dateKey, b.time, b.contactEmail) === identity
    );
  }

  function createHold(deptId, dateKey, time, contactEmail) {
    cleanExpiredHolds();
    if (isSlotTaken(deptId, dateKey, time, contactEmail)) return null;
    const hold = {
      id: uid(),
      deptId,
      dateKey,
      time,
      contactEmail: contactEmail || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + HOLD_DURATION_MS
    };
    const holds = read(HOLDS_KEY);
    holds.push(hold);
    write(HOLDS_KEY, holds);
    return hold;
  }

  function getHold(id) {
    return cleanExpiredHolds().find((h) => h.id === id) || null;
  }

  function releaseHold(id) {
    write(HOLDS_KEY, read(HOLDS_KEY).filter((h) => h.id !== id));
  }

  function confirmHold(id, citizen) {
    const hold = getHold(id);
    if (!hold) return null;
    const booking = {
      id: uid(),
      deptId: hold.deptId,
      dateKey: hold.dateKey,
      time: hold.time,
      contactEmail: hold.contactEmail,
      citizen,
      status: 'confirmed',
      createdAt: Date.now()
    };
    const bookings = read(BOOKINGS_KEY);
    bookings.push(booking);
    write(BOOKINGS_KEY, bookings);
    releaseHold(id);
    return booking;
  }

  function getMyBookings() {
    return read(BOOKINGS_KEY)
      .filter((b) => b.status !== 'cancelled')
      .sort((a, b) => (a.dateKey + a.time).localeCompare(b.dateKey + b.time));
  }

  function cancelBooking(id) {
    const bookings = read(BOOKINGS_KEY);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    bookings[idx].status = 'cancelled';
    write(BOOKINGS_KEY, bookings);
    return bookings[idx];
  }

  return {
    HOLD_DURATION_MS,
    cleanExpiredHolds,
    isSlotTaken,
    createHold,
    getHold,
    releaseHold,
    confirmHold,
    getMyBookings,
    cancelBooking
  };
})();
