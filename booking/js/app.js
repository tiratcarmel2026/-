/*
 * לוגיקת הממשק (UI) של מערכת קביעת התורים.
 * כל הרינדור מתבצע בצד לקוח לתוך #app-root, ללא שרת.
 */

(function () {
  const root = document.getElementById('app-root');
  const { dateKey, availableSlots, upcomingOpenDates } = window.TCScheduler;
  const Store = window.TCStore;
  const Email = window.TCEmail;
  const DEPARTMENTS = window.TC_DEPARTMENTS;
  const DAY_NAMES = window.TC_DAY_NAMES;

  const state = {
    screen: 'list',
    deptId: null,
    contact: null,
    selectedDate: null,
    hold: null,
    lastResult: null
  };

  let countdownTimer = null;

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function getDept(id) {
    return DEPARTMENTS.find((d) => d.id === id);
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDateHuman(d) {
    return `יום ${DAY_NAMES[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}`;
  }

  function clearCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function goTo(screen, patch) {
    Object.assign(state, { screen }, patch || {});
    render();
  }

  // ---------- מסך 1: רשימת מחלקות ----------
  function renderList() {
    const cards = DEPARTMENTS.map((d) => {
      const badge = d.onlineBookingAvailable
        ? '<span class="badge badge--ok">קביעת תור אונליין</span>'
        : '<span class="badge badge--info">יצירת קשר בלבד</span>';
      return `
        <button class="dept-card" data-dept="${d.id}">
          <h3>${escapeHtml(d.name)}</h3>
          ${d.address ? `<p class="dept-card__addr">📍 ${escapeHtml(d.address)}</p>` : ''}
          <p class="dept-card__phone">☎️ ${d.phones.map(escapeHtml).join(' / ')}</p>
          ${badge}
        </button>`;
    }).join('');

    root.innerHTML = `
      <div class="intro">
        <h2>בחרו מחלקה או שירות</h2>
        <p>מרכזיה עירונית: ${escapeHtml(window.TC_MUNICIPALITY_SWITCHBOARD)}</p>
      </div>
      <div class="dept-grid">${cards}</div>`;

    root.querySelectorAll('.dept-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dept = getDept(btn.dataset.dept);
        state.deptId = dept.id;
        state.contact = null;
        if (!dept.onlineBookingAvailable) {
          goTo('contact-only');
        } else if (dept.contacts && dept.contacts.length) {
          goTo('contacts');
        } else {
          goTo('calendar', { selectedDate: null });
        }
      });
    });
  }

  // ---------- מסך: מחלקה ללא קביעת תור אונליין ----------
  function renderContactOnly() {
    const dept = getDept(state.deptId);
    root.innerHTML = `
      <button class="btn-back" id="back">→ חזרה לרשימת המחלקות</button>
      <div class="panel">
        <h2>${escapeHtml(dept.name)}</h2>
        ${dept.address ? `<p>📍 ${escapeHtml(dept.address)}</p>` : ''}
        <p>☎️ ${dept.phones.map(escapeHtml).join(' / ')}</p>
        ${dept.email ? `<p>✉️ <a href="mailto:${escapeHtml(dept.email)}">${escapeHtml(dept.email)}</a></p>` : ''}
        <p class="note">${escapeHtml(dept.note)}</p>
      </div>`;
    document.getElementById('back').addEventListener('click', () => goTo('list'));
  }

  // ---------- מסך 2: בחירת איש/אשת קשר (לאגף החינוך) ----------
  function renderContacts() {
    const dept = getDept(state.deptId);
    const rows = dept.contacts
      .map(
        (c, i) => `
        <button class="contact-row" data-idx="${i}">
          <strong>${escapeHtml(c.name)}</strong>
          ${c.role ? `<span class="contact-role">${escapeHtml(c.role)}</span>` : ''}
        </button>`
      )
      .join('');
    root.innerHTML = `
      <button class="btn-back" id="back">→ חזרה לרשימת המחלקות</button>
      <div class="panel">
        <h2>${escapeHtml(dept.name)}</h2>
        <p class="note">${escapeHtml(dept.note)}</p>
        <div class="contact-list">${rows}</div>
      </div>`;
    document.getElementById('back').addEventListener('click', () => goTo('list'));
    root.querySelectorAll('.contact-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.contact = dept.contacts[Number(btn.dataset.idx)];
        goTo('calendar', { selectedDate: null });
      });
    });
  }

  // ---------- מסך 3: לוח תאריכים + משבצות זמן ----------
  function renderCalendar() {
    const dept = getDept(state.deptId);
    const openDates = upcomingOpenDates(dept, { daysAhead: 21 });
    if (!state.selectedDate && openDates.length) state.selectedDate = openDates[0];

    const dateButtons = openDates
      .map((d) => {
        const active = state.selectedDate && dateKey(d) === dateKey(state.selectedDate) ? 'is-active' : '';
        return `<button class="date-chip ${active}" data-date="${dateKey(d)}">${formatDateHuman(d)}</button>`;
      })
      .join('');

    let slotsHtml = '<p class="note">אין תאריך זמין בטווח הקרוב.</p>';
    if (state.selectedDate) {
      const isTaken = (time) =>
        Store.isSlotTaken(dept.id, dateKey(state.selectedDate), time, state.contact ? state.contact.email : '');
      const slots = availableSlots(dept, state.selectedDate, isTaken);
      slotsHtml = slots.length
        ? `<div class="slot-grid">${slots
            .map((t) => `<button class="slot-chip" data-time="${t}">${t}</button>`)
            .join('')}</div>`
        : '<p class="note">אין משבצות פנויות בתאריך זה.</p>';
    }

    root.innerHTML = `
      <button class="btn-back" id="back">→ חזרה</button>
      <div class="panel">
        <h2>${escapeHtml(dept.name)}${state.contact ? ' · ' + escapeHtml(state.contact.name) : ''}</h2>
        ${dept.note ? `<p class="note">${escapeHtml(dept.note)}</p>` : ''}
        <h3>בחרו תאריך</h3>
        <div class="date-row">${dateButtons}</div>
        <h3>בחרו שעה</h3>
        ${slotsHtml}
      </div>`;

    document.getElementById('back').addEventListener('click', () => {
      if (dept.contacts && dept.contacts.length) goTo('contacts');
      else goTo('list');
    });
    root.querySelectorAll('.date-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        state.selectedDate = new Date(y, m - 1, d);
        render();
      });
    });
    root.querySelectorAll('.slot-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hold = Store.createHold(
          dept.id,
          dateKey(state.selectedDate),
          btn.dataset.time,
          state.contact ? state.contact.email : ''
        );
        if (!hold) {
          alert('מצטערים, מישהו אחר כבר תפס את המשבצת הזו. נסו משבצת אחרת.');
          render();
          return;
        }
        goTo('form', { hold });
      });
    });
  }

  // ---------- מסך 4: טופס פרטי תושב + טיימר החזקה ----------
  function renderForm() {
    const dept = getDept(state.deptId);
    root.innerHTML = `
      <div class="panel">
        <h2>פרטי התור</h2>
        <p><strong>${escapeHtml(dept.name)}${state.contact ? ' · ' + escapeHtml(state.contact.name) : ''}</strong>
           — ${formatDateHuman(state.selectedDate)}, שעה ${escapeHtml(state.hold.time)}</p>
        <p class="hold-timer">המשבצת שמורה עבורכם למשך <span id="countdown">15:00</span> דקות</p>
        <form id="booking-form">
          <label>שם מלא<input required name="name" type="text" maxlength="80"></label>
          <label>טלפון<input required name="phone" type="tel" maxlength="20"></label>
          <label>אימייל<input required name="email" type="email" maxlength="120"></label>
          <label>הערות (אופציונלי)<textarea name="notes" maxlength="500"></textarea></label>
          <div class="form-actions">
            <button type="button" class="btn-secondary" id="cancel-hold">ביטול</button>
            <button type="submit" class="btn-primary">אישור קביעת התור</button>
          </div>
        </form>
      </div>`;

    document.getElementById('cancel-hold').addEventListener('click', () => {
      clearCountdown();
      Store.releaseHold(state.hold.id);
      goTo('calendar');
    });

    document.getElementById('booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const citizen = {
        name: fd.get('name').trim(),
        phone: fd.get('phone').trim(),
        email: fd.get('email').trim(),
        notes: fd.get('notes').trim()
      };
      const booking = Store.confirmHold(state.hold.id, citizen);
      if (!booking) {
        alert('פג תוקף ההחזקה על המשבצת. יש לבחור שוב.');
        goTo('calendar', { hold: null });
        return;
      }
      clearCountdown();
      const submitBtn = e.target.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'שולח אישור...';
      const emailResult = await Email.notifyBooking(booking, dept, state.contact);
      goTo('confirm', { lastResult: { booking, dept, contact: state.contact, emailResult } });
    });

    clearCountdown();
    const tick = () => {
      const hold = Store.getHold(state.hold.id);
      const countdownEl = document.getElementById('countdown');
      if (!hold) {
        clearCountdown();
        alert('פג תוקף ההחזקה על המשבצת (15 דקות). יש לבחור משבצת מחדש.');
        goTo('calendar', { hold: null });
        return;
      }
      const remainingMs = hold.expiresAt - Date.now();
      const mm = Math.max(0, Math.floor(remainingMs / 60000));
      const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
      if (countdownEl) countdownEl.textContent = `${mm}:${String(ss).padStart(2, '0')}`;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // ---------- מסך 5: אישור סופי ----------
  function renderConfirm() {
    clearCountdown();
    const { booking, dept, contact, emailResult } = state.lastResult;
    const deptMailWarning =
      !emailResult.departmentResult.sent && emailResult.departmentResult.mailto
        ? `<p class="note note--warn">שליחת המייל האוטומטית למחלקה אינה מוגדרת עדיין.
           <a href="${emailResult.departmentResult.mailto}">לחצו כאן לשליחת המייל ידנית</a> כדי להשלים את העדכון למחלקה.</p>`
        : '';
    const citizenMailWarning =
      !emailResult.citizenResult.sent && emailResult.citizenResult.mailto
        ? `<p class="note note--warn">שליחת מייל אישור אוטומטי אינה מוגדרת עדיין.
           <a href="${emailResult.citizenResult.mailto}">לחצו כאן לשליחת אישור לעצמכם</a>.</p>`
        : '';

    root.innerHTML = `
      <div class="panel panel--success">
        <h2>✅ התור נקבע בהצלחה</h2>
        <p><strong>${escapeHtml(dept.name)}${contact ? ' · ' + escapeHtml(contact.name) : ''}</strong></p>
        <p>${formatDateHuman(parseDateKey(booking.dateKey))}, שעה ${escapeHtml(booking.time)}</p>
        <p>אישור נשלח לכתובת: ${escapeHtml(booking.citizen.email)}</p>
        ${deptMailWarning}
        ${citizenMailWarning}
        <div class="form-actions">
          <button class="btn-secondary" id="add-ics">📅 הוספה ליומן</button>
          <button class="btn-primary" id="to-my">התורים שלי</button>
          <button class="btn-secondary" id="to-list">קביעת תור נוסף</button>
        </div>
      </div>`;

    document.getElementById('add-ics').addEventListener('click', () => Email.downloadICS(booking, dept, contact));
    document.getElementById('to-my').addEventListener('click', () => goTo('my'));
    document.getElementById('to-list').addEventListener('click', () => goTo('list', { deptId: null, contact: null, selectedDate: null }));
  }

  // ---------- מסך 6: התורים שלי ----------
  function renderMy() {
    const bookings = Store.getMyBookings();
    const rows = bookings.length
      ? bookings
          .map((b) => {
            const dept = getDept(b.deptId);
            const dateObj = parseDateKey(b.dateKey);
            return `
            <div class="my-booking">
              <div>
                <strong>${escapeHtml(dept ? dept.name : b.deptId)}</strong>
                <div>${formatDateHuman(dateObj)}, שעה ${escapeHtml(b.time)}</div>
                <div class="dept-card__phone">${escapeHtml(b.citizen.name)} · ${escapeHtml(b.citizen.phone)}</div>
              </div>
              <button class="btn-secondary" data-id="${b.id}">ביטול תור</button>
            </div>`;
          })
          .join('')
      : '<p class="note">אין תורים שמורים בדפדפן זה.</p>';

    root.innerHTML = `
      <button class="btn-back" id="back">→ חזרה לרשימת המחלקות</button>
      <div class="panel">
        <h2>התורים שלי</h2>
        <p class="note note--warn">הרשימה נשמרת בדפדפן זה בלבד ואינה מסונכרנת בין מכשירים.</p>
        ${rows}
      </div>`;

    document.getElementById('back').addEventListener('click', () => goTo('list'));
    root.querySelectorAll('.my-booking button').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('לבטל את התור?')) {
          Store.cancelBooking(btn.dataset.id);
          render();
        }
      });
    });
  }

  function render() {
    clearCountdown();
    switch (state.screen) {
      case 'contact-only':
        return renderContactOnly();
      case 'contacts':
        return renderContacts();
      case 'calendar':
        return renderCalendar();
      case 'form':
        return renderForm();
      case 'confirm':
        return renderConfirm();
      case 'my':
        return renderMy();
      default:
        return renderList();
    }
  }

  document.getElementById('nav-my-bookings').addEventListener('click', () => goTo('my'));
  document.getElementById('nav-home').addEventListener('click', () => goTo('list', { deptId: null, contact: null, selectedDate: null }));

  Store.cleanExpiredHolds();
  render();
})();
