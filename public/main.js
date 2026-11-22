/* DPM Tech Group — site scripts
 * Loaded with <script src="main.js" defer></script> at the end of <body>.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Footer year
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Back-to-top button: show after scrolling one screen, smooth-scroll on click
  (function () {
    var btn = document.getElementById('toTop');
    if (!btn) return;
    var ticking = false;

    function update() {
      btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var brand = document.querySelector('.brand');
      if (brand) brand.focus({ preventScroll: true }); // keep keyboard focus at the top
    });
  })();

  // "See how I work" video: start from the beginning when it scrolls into view, pause when it leaves
  (function () {
    var video = document.getElementById('howVideo');
    if (!video || !('IntersectionObserver' in window)) return;
    if (reduceMotion.matches) return; // poster only
    var started = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!started) { video.currentTime = 0; started = true; }
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.5 }).observe(video);
  })();

  // Mobile menu: toggle, close on link tap, outside click, Escape, or widening past the breakpoint
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('mainMenu');
    if (!toggle || !menu) return;
    var wide = window.matchMedia('(min-width: 761px)');

    function setOpen(open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !e.target.closest('.nav')) setOpen(false);
    });
    wide.addEventListener('change', function () { if (wide.matches) setOpen(false); });
  })();
    // Talks & Demos: open a YouTube video in a pop-up player; stop it on close
  (function () {
    var dialog = document.getElementById('videoDialog');
    var frame = document.getElementById('videoFrame');
    if (!dialog || !frame || typeof dialog.showModal !== 'function') return;
    var heading = document.getElementById('videoDialogTitle');
    var lastCard = null;

    document.querySelectorAll('.video-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-video-id');
        var title = card.getAttribute('data-video-title') || 'Video';
        lastCard = card;
        heading.textContent = title;
        frame.title = title;
        frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
        dialog.showModal();
      });
    });

    dialog.querySelector('.video-dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // click outside the player
    dialog.addEventListener('close', function () {
      frame.src = '';                       // stops playback
      if (lastCard) lastCard.focus();       // return keyboard focus to the card
    });
  })();
})();