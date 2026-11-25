(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'tc-library-loans';
  var DAY = 86400000;
  var last = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function compact(d) { return iso(d).replace(/-/g, ''); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function nice(d) {
    return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function daysLeft(s) { return Math.round((parse(s) - today()) / DAY); }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ } }

  function toast(t) {
    var el = $('toast'); el.textContent = t; el.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }

  function title(loan) { return 'להחזיר ספרים לספרייה' + (loan.who ? ' (' + loan.who + ')' : ''); }
  function details(loan) {
    var s = 'תאריך החזרה: ' + nice(parse(loan.due)) + '.';
    if (loan.books) s += '\nספרים: ' + loan.books;
    s += '\nלא מספיקים? אפשר בדרך כלל להאריך בטלפון לספרייה לפני התאריך.';
    return s;
  }

  // .ics with two alarms: 3 days before at 9:00 and the morning of the due date at 9:00.
  function ics(loan) {
    var d = parse(loan.due);
    var esc = function (t) { return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); };
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tirat Carmel//Library reminder//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + loan.id + '@tiratcarmel-library',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + compact(d),
      'DTEND;VALUE=DATE:' + compact(addDays(d, 1)),
      'SUMMARY:' + esc('📚 ' + title(loan)),
      'DESCRIPTION:' + esc(details(loan)),
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc('עוד 3 ימים צריך להחזיר ספרים לספרייה'), 'TRIGGER:-P2DT15H', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc('היום מחזירים ספרים לספרייה'), 'TRIGGER:PT9H', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }

  function gcal(loan) {
    var d = parse(loan.due);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent('📚 ' + title(loan))
      + '&dates=' + compact(d) + '/' + compact(addDays(d, 1))
      + '&details=' + encodeURIComponent(details(loan));
  }

  function wa(loan) {
    var t = '📚 תזכורת: ' + title(loan) + ' עד ' + nice(parse(loan.due)) + (loan.books ? '\n' + loan.books : '');
    return 'https://wa.me/?text=' + encodeURIComponent(t);
  }

  function download(loan) {
    var blob = new Blob([ics(loan)], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'library-' + loan.due + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('נפתח היומן, אשרו "הוסף"');
  }

  function show(loan) {
    last = loan;
    var n = daysLeft(loan.due);
    $('summary').innerHTML = '';
    var b = document.createElement('div');
    b.textContent = 'תאריך החזרה: ' + nice(parse(loan.due));
    var s = document.createElement('small');
    s.textContent = n > 0 ? 'עוד ' + n + ' ימים' : n === 0 ? 'זה היום!' : 'התאריך כבר עבר';
    $('summary').append(b, s);
    $('gcal').href = gcal(loan);
    $('wa').href = wa(loan);
    $('result').hidden = false;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function badge(n) {
    if (n < 0) return ['badge--late', 'באיחור ' + (-n) + ' ימים'];
    if (n === 0) return ['badge--late', 'היום!'];
    if (n <= 3) return ['badge--soon', n === 1 ? 'מחר' : 'עוד ' + n + ' ימים'];
    return ['badge--ok', 'עוד ' + n + ' ימים'];
  }

  function render() {
    var list = load().sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var ul = $('loans'); ul.innerHTML = '';
    if (!list.length) {
      var e = document.createElement('li'); e.className = 'empty'; e.textContent = 'אין כרגע ספרים ברשימה'; ul.append(e); return;
    }
    list.forEach(function (loan) {
      var li = document.createElement('li');
      var body = document.createElement('div'); body.className = 'loan__body';
      var t = document.createElement('div'); t.className = 'loan__title'; t.textContent = loan.books || 'ספרים מהספרייה';
      var d = document.createElement('div'); d.className = 'loan__date'; d.textContent = nice(parse(loan.due)) + (loan.who ? ' · ' + loan.who : '');
      body.append(t, d);
      var bd = badge(daysLeft(loan.due));
      var tag = document.createElement('span'); tag.className = 'badge ' + bd[0]; tag.textContent = bd[1];
      var cal = document.createElement('button'); cal.className = 'mini'; cal.type = 'button'; cal.textContent = '📅'; cal.title = 'הוספה ליומן';
      cal.setAttribute('aria-label', 'הוספה ליומן');
      cal.onclick = function () { show(loan); };
      var done = document.createElement('button'); done.className = 'mini'; done.type = 'button'; done.textContent = '✓'; done.title = 'החזרתי';
      done.setAttribute('aria-label', 'החזרתי, הסירו מהרשימה');
      done.onclick = function () {
        save(load().filter(function (x) { return x.id !== loan.id; }));
        render(); toast('כל הכבוד! הוחזר בזמן 🎉');
      };
      li.append(body, tag, cal, done);
      ul.append(li);
    });
  }

  // quick chips
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
    c.onclick = function () {
      $('due').value = iso(addDays(today(), +c.dataset.days));
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (x) { x.classList.toggle('on', x === c); });
    };
  });
  $('due').oninput = function () {
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (x) { x.classList.remove('on'); });
  };
  $('due').min = iso(today());

  $('form').onsubmit = function (ev) {
    ev.preventDefault();
    $('msg').textContent = '';
    if (!$('due').value) { $('msg').textContent = 'בחרו תאריך החזרה'; return; }
    var loan = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      due: $('due').value,
      books: $('books').value.trim(),
      who: $('who').value.trim()
    };
    var list = load(); list.push(loan); save(list);
    render(); show(loan);
    $('books').value = '';
  };

  $('ics').onclick = function () { if (last) download(last); };

  render();
})();
