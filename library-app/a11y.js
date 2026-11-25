// Accessibility toolbar: text size, contrast, grayscale, links, readable font, stop motion.
// Choices are remembered on this device.
(function () {
  'use strict';
  var KEY = 'tc-a11y';
  var root = document.documentElement;
  var FLAGS = ['contrast', 'gray', 'links', 'font', 'still'];
  var state = { size: 0 };
  try { state = JSON.parse(localStorage.getItem(KEY)) || state; } catch (e) { /* storage blocked */ }

  function apply() {
    root.style.fontSize = (100 + state.size * 12.5) + '%';
    FLAGS.forEach(function (f) { root.classList.toggle('a11y-' + f, !!state[f]); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-a11y]'), function (b) {
      var f = b.getAttribute('data-a11y');
      if (FLAGS.indexOf(f) > -1) b.setAttribute('aria-pressed', state[f] ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
  }

  var btn = document.getElementById('a11yBtn');
  var panel = document.getElementById('a11yPanel');
  function open(on) {
    panel.hidden = !on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) panel.querySelector('button').focus();
  }
  btn.onclick = function () { open(panel.hidden); };
  document.getElementById('a11yClose').onclick = function () { open(false); btn.focus(); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });

  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a11y]');
    if (!b) return;
    var a = b.getAttribute('data-a11y');
    if (a === 'bigger') state.size = Math.min(state.size + 1, 4);
    else if (a === 'smaller') state.size = Math.max(state.size - 1, -1);
    else if (a === 'reset') state = { size: 0 };
    else state[a] = !state[a];
    apply();
  });

  apply();
})();
