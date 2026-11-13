// Swup loaded from CDN in baseof.html (window.Swup) to avoid npm resolution in theme during Hugo js.Build
const Swup = window.Swup;
if (!Swup) throw new Error('Swup not loaded');

const swup = new Swup({
    containers: ["#swup"],
    animateHistoryBrowsing: true,
    cache: true
});

// Expose globally so module scripts (mermaid, etc.) can hook into page transitions
window.swup = swup;

// Navigation Active State Update + LinkedIn Share link (so Share always points to current page URL)
// + GitHub nav link sync (so client-side Swup navigation shows the correct repo or hides the link)
// A link is active when the current path starts with its href, or with any prefix
// listed in data-nav-match (the Work link covers /work/, /blog/... and /projects/...).
function navLinkMatches(el, path) {
    const href = el.getAttribute('href');
    if (!href || href === '#') return false;
    const hrefPath = href.startsWith('http') ? new URL(href).pathname : href;
    const prefixes = (el.dataset.navMatch || hrefPath).split(',').map(p => p.trim()).filter(Boolean);
    return prefixes.some(prefix => prefix === path || (prefix !== '/' && path.startsWith(prefix.replace(/\/$/, ''))));
}

function updateNav() {
    const path = window.location.pathname;
    // Use current page URL so share works on client-side nav, localhost, and correct baseURL
    const shareURL = window.location.href;
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
        el.classList.toggle('active', navLinkMatches(el, path));
    });
    // Update every LinkedIn share link on the page (bottom nav + any in-content) to current URL
    document.querySelectorAll('a[href*="linkedin.com/sharing"]').forEach(el => {
        el.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareURL);
    });

    // Sync bottom nav GitHub link from the current page's content (inside #swup) so it updates after Swup navigation
    const githubLink = document.getElementById('bottom-nav-github-link');
    if (githubLink) {
        const swupContainer = document.querySelector('#swup');
        const meta = swupContainer && swupContainer.querySelector('meta[name="page-github-repo"]');
        const repo = meta ? (meta.getAttribute('content') || '').trim() : '';
        if (repo) {
            githubLink.href = repo;
            githubLink.classList.remove('hidden');
            githubLink.removeAttribute('aria-hidden');
        } else {
            githubLink.href = '#';
            githubLink.classList.add('hidden');
            githubLink.setAttribute('aria-hidden', 'true');
        }
    }

    // Desktop top nav: sync active state (same path logic as bottom nav)
    document.querySelectorAll('.desktop-top-nav a.desktop-nav-link').forEach(el => {
        el.classList.toggle('active', !el.target && navLinkMatches(el, path));
    });
}

swup.hooks.on('page:view', updateNav);
// Run when DOM is ready and after Swup so share URL is always correct
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
} else {
    updateNav();
}

// ------------------ Scroll reveal (Intersection Observer) ------------------
// Re-triggers every time elements enter/leave viewport (no unobserve).
function initScrollReveal() {
  const container = document.querySelector('#swup');
  const root = container || document;
  const els = root.querySelectorAll('.scroll-reveal');
  if (!els.length) return;

  const viewH = window.innerHeight;

  els.forEach((el) => {
    if (el.getBoundingClientRect().top < viewH + 40) {
      el.classList.add('in-view');
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    },
    { root: null, rootMargin: '40px 0px', threshold: 0.01 }
  );
  els.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initScrollReveal);
swup.hooks.on('page:view', () => {
  requestAnimationFrame(initScrollReveal);
});

// ------------------ Screenshot carousel — init on load and after Swup (inline scripts in replaced content do not run) ------------------
function initScreenshotCarousels() {
  const container = document.querySelector('#swup');
  const root = container || document;
  const carousels = root.querySelectorAll('.screenshot-carousel');
  carousels.forEach((rootEl) => {
    if (rootEl.dataset.carouselInitialized) return;
    rootEl.dataset.carouselInitialized = '1';

    const slides = rootEl.querySelectorAll('.screenshot-carousel-slide');
    const dots = rootEl.querySelectorAll('.screenshot-carousel-dot');
    const pauseBtn = rootEl.querySelector('.screenshot-carousel-pause');
    if (!pauseBtn || !slides.length) return;

    const intervalMs = parseInt(rootEl.dataset.interval || '4', 10) * 1000;
    let timer = null;
    let current = 0;
    let paused = false;

    function goTo(idx) {
      if (idx < 0) idx = slides.length - 1;
      if (idx >= slides.length) idx = 0;
      current = idx;
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === current);
        s.setAttribute('aria-hidden', i !== current);
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      const counter = rootEl.querySelector('.screenshot-carousel-counter');
      if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
    }

    function next() {
      if (slides.length <= 1) return;
      goTo(current + 1);
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      if (slides.length <= 1 || paused) return;
      timer = setInterval(next, intervalMs);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute('aria-label', paused ? 'Play carousel' : 'Pause carousel');
      pauseBtn.setAttribute('aria-pressed', paused);
      const iconPause = pauseBtn.querySelector('.icon-pause');
      const iconPlay = pauseBtn.querySelector('.icon-play');
      if (iconPause) iconPause.hidden = paused;
      if (iconPlay) iconPlay.hidden = !paused;
      if (paused) stopTimer();
      else startTimer();
    }

    pauseBtn.addEventListener('click', () => setPaused(!paused));
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i);
        if (!paused) startTimer();
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startTimer();
          else stopTimer();
        });
      },
      { threshold: 0.25 }
    );
    io.observe(rootEl);
    startTimer();
  });
}

document.addEventListener('DOMContentLoaded', initScreenshotCarousels);
swup.hooks.on('page:view', () => {
  requestAnimationFrame(initScreenshotCarousels);
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn?.querySelector('.theme-icon');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    // Sync browser chrome color so mobile browser UI matches the site theme
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0c' : '#f5f6f8');
    } catch (e) { /* noop */ }

    // update icon and label to reflect the *next* theme on click
    if (themeIcon) {
        // we show the *opposite* theme's icon to indicate what will happen when
        // the user clicks the button. dark theme displays sun, light theme shows moon
        if (theme === 'dark') {
            // display light icon (sun)
            themeIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        } else {
            // display dark icon (moon)
            themeIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        }
    }

    if (themeToggleBtn) {
        const next = theme === 'dark' ? 'light' : 'dark';
        themeToggleBtn.setAttribute('aria-label', `Switch to ${next} theme`);
    }
} 

// Init Theme — respect localStorage first, then system preference
const savedTheme = localStorage.getItem('theme');
const systemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (systemDark ? 'dark' : 'light');
setTheme(initialTheme);

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });
}

// ------------------ Desktop top nav: Listen button triggers audio player ------------------
function initDesktopAudioTrigger() {
  const desktopTrigger = document.querySelector('.desktop-audio-trigger');
  const mainTrigger = document.getElementById('audio-player-trigger');
  if (!desktopTrigger) return;
  // Avoid attaching the same listener multiple times (e.g. after Swup page:view)
  if (desktopTrigger.dataset.audioListenerAttached) return;
  desktopTrigger.dataset.audioListenerAttached = '1';

  desktopTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    // Read page audio from current page content so playback starts on first click (desktop)
    const dataEl = document.getElementById('page-audio-data');
    if (dataEl && dataEl.dataset.src) {
      if (typeof window.playAudio === 'function') {
        window.playAudio(dataEl.dataset.src, dataEl.dataset.title || 'Now Playing...');
      }
      return;
    }
    // No page audio: toggle play/pause or no-op via the main trigger (e.g. after nav away)
    if (mainTrigger) mainTrigger.click();
  });
}
document.addEventListener('DOMContentLoaded', initDesktopAudioTrigger);
swup.hooks.on('page:view', () => { initDesktopAudioTrigger(); });

// ------------------ Bottom navigation collapse control ------------------
(function initBottomNavCollapse() {
  const bottomNav = document.querySelector('.bottom-nav');
  const toggle = document.getElementById('bottom-nav-toggle');
  if (!bottomNav || !toggle) return;

  function applyCollapsed(collapsed) {
    bottomNav.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('bottom-nav-collapsed', collapsed);
    toggle.classList.toggle('collapsed', collapsed);
    // accessibility
    toggle.setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem('bottomNavCollapsed', collapsed ? '1' : '0');
  }

  // restore state on load
  const stored = localStorage.getItem('bottomNavCollapsed');
  const initialCollapsed = stored === '1';
  applyCollapsed(initialCollapsed);

  toggle.addEventListener('click', (e) => {
    const isCollapsed = bottomNav.classList.contains('collapsed');
    applyCollapsed(!isCollapsed);
  });

  // Re-apply after swup page swaps (persisted state)
  if (window.swup && window.swup.hooks) {
    window.swup.hooks.on('page:view', () => {
      const s = localStorage.getItem('bottomNavCollapsed');
      applyCollapsed(s === '1');
    });
  }
})();

// ------------------ Player-bar hide/show control ------------------
(function initPlayerBarToggle() {
  const playerBar = document.getElementById('audio-player-bar');
  const toggle = document.getElementById('player-bar-toggle');
  const audioEl = document.getElementById('global-audio');
  if (!playerBar || !toggle) return;

  function applyPlayerCollapsed(collapsed) {
    playerBar.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('player-bar-collapsed', collapsed);
    toggle.classList.toggle('collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem('playerBarCollapsed', collapsed ? '1' : '0');

    // When user explicitly hides the player, also hide the visible UI to avoid accidental reopen
    if (collapsed) playerBar.classList.add('hidden');
    else {
      // if audio is currently playing/showing, reveal; otherwise keep hidden until user triggers play
      const isPlaying = audioEl && !audioEl.paused && audioEl.src;
      if (isPlaying) playerBar.classList.remove('hidden');
    }
  }

  // restore state on load
  const stored = localStorage.getItem('playerBarCollapsed');
  const initialCollapsed = stored === '1';
  applyPlayerCollapsed(initialCollapsed);

  toggle.addEventListener('click', () => {
    const isCollapsed = playerBar.classList.contains('collapsed');
    applyPlayerCollapsed(!isCollapsed);
  });

  // Re-apply after swup page swaps (persisted state)
  if (window.swup && window.swup.hooks) {
    window.swup.hooks.on('page:view', () => {
      const s = localStorage.getItem('playerBarCollapsed');
      applyPlayerCollapsed(s === '1');
    });
  }
})();

import './audio-player.js';
import './ai-chat.js';
import { runScrollspy } from './scrollspy.js';
import { initCareStory } from './care-story.js';
import { initWorkHub } from './work-hub.js';

document.addEventListener('DOMContentLoaded', runScrollspy);
if (window.swup && window.swup.hooks) {
  window.swup.hooks.on('page:view', () => requestAnimationFrame(runScrollspy));
}

// ------------------ CARE scroll story (home) and Work hub filters (/work/) ------------------
// Both look for their own root element and do nothing on pages that lack it. Inline scripts in
// swapped content do not run under Swup, so they start here: on first load and after every visit.
function initPageFeatures() {
  initCareStory();
  initWorkHub();
}
document.addEventListener('DOMContentLoaded', initPageFeatures);
swup.hooks.on('page:view', () => requestAnimationFrame(initPageFeatures));
