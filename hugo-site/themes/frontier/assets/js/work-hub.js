/**
 * Work hub (/work/) — find anything in the one list of posts and projects.
 * Markup: layouts/section/work.html and layouts/partials/work/card.html.
 *
 * The page lists every card without JavaScript. This module adds three ways to
 * narrow the list, and keeps them in the URL so a filtered view can be shared:
 *
 *   ?kind=case-study   what the reader came for (the chips)
 *   ?tag=architecture  a topic: any tag, category or series name, urlized
 *   ?q=migration       free text, matched against title, summary, tags and series parts
 *
 * Folded series: a long series is represented by one hub card (data-series-hub)
 * that lists its parts. The parts' own cards (data-series-part) stay folded
 * while that hub card is in view. They appear on their own when the reader
 * searches or picks a topic (so "cybersecurity" finds the exact part), or picks
 * a kind the hub does not belong to (so a case study that is part of a build's
 * series still shows under Case studies).
 */
export function initWorkHub() {
  const root = document.querySelector('[data-work-hub]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const cards = [...root.querySelectorAll('[data-work-item]')].map((el) => ({
    el,
    kind: el.dataset.kind,
    tags: (el.dataset.tags || '').split(',').filter(Boolean),
    seriesPart: el.dataset.seriesPart || '',
    seriesHub: el.dataset.seriesHub || '',
    text: `${el.textContent} ${(el.dataset.tags || '').replace(/[-,]/g, ' ')}`.toLowerCase().replace(/\s+/g, ' '),
  }));
  const chips = [...root.querySelectorAll('[data-kind-chip]')];
  const input = root.querySelector('[data-work-search]');
  const blurb = root.querySelector('[data-work-blurb]');
  const status = root.querySelector('[data-work-status]');
  const topic = root.querySelector('[data-work-topic]');
  const empty = root.querySelector('[data-work-empty]');
  const clear = root.querySelector('[data-work-clear]');

  const params = new URLSearchParams(window.location.search);
  const requestedKind = params.get('kind');
  const state = {
    kind: chips.some((chip) => chip.dataset.kindChip === requestedKind) ? requestedKind : 'all',
    tag: (params.get('tag') || params.get('tags') || '').trim().toLowerCase(),
    q: params.get('q') || '',
  };
  if (input) input.value = state.q;

  /** Keep the address bar in step, without adding history entries. */
  const syncUrl = () => {
    const next = new URLSearchParams();
    if (state.kind !== 'all') next.set('kind', state.kind);
    if (state.tag) next.set('tag', state.tag);
    if (state.q.trim()) next.set('q', state.q.trim());
    const query = next.toString();
    const url = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    if (url === window.location.pathname + window.location.search + window.location.hash) return;
    // Swup stores the page URL in history.state and reloads from it on back/forward.
    window.history.replaceState({ ...(window.history.state || {}), url }, '', url);
  };
  let urlTimer = null;
  const syncUrlSoon = () => { clearTimeout(urlTimer); urlTimer = setTimeout(syncUrl, 350); };

  const apply = () => {
    const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const searching = terms.length > 0 || state.tag !== '';
    const matches = (card) =>
      (state.kind === 'all' || card.kind === state.kind) &&
      (!state.tag || card.tags.includes(state.tag)) &&
      terms.every((term) => card.text.includes(term));
    const hubsInView = new Set(cards.filter((card) => card.seriesHub && matches(card)).map((card) => card.seriesHub));
    let shown = 0;
    for (const card of cards) {
      const folded = card.seriesPart && !searching && hubsInView.has(card.seriesPart);
      const visible = matches(card) && !folded;
      card.el.hidden = !visible;
      if (visible) shown += 1;
    }

    chips.forEach((chip) => {
      const on = chip.dataset.kindChip === state.kind;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', String(on));
      if (on && blurb) blurb.textContent = chip.dataset.blurb || '';
    });

    if (topic) {
      topic.hidden = !state.tag;
      if (state.tag) {
        const name = state.tag.replace(/-/g, ' ');
        topic.textContent = `Topic: ${name} ✕`;
        topic.setAttribute('aria-label', `Remove the topic filter: ${name}`);
      }
    }
    if (empty) empty.hidden = shown > 0;
    if (status) {
      const filtered = searching || state.kind !== 'all';
      status.textContent = filtered ? `Showing ${shown} ${shown === 1 ? 'item' : 'items'}.` : '';
    }
  };

  chips.forEach((chip) => chip.addEventListener('click', () => {
    const picked = chip.dataset.kindChip;
    state.kind = picked === state.kind ? 'all' : picked; // a second tap on the active chip clears it
    apply();
    syncUrl();
  }));
  if (input) input.addEventListener('input', () => {
    state.q = input.value;
    apply();
    syncUrlSoon();
  });
  if (topic) topic.addEventListener('click', () => {
    state.tag = '';
    apply();
    syncUrl();
  });
  if (clear) clear.addEventListener('click', () => {
    state.kind = 'all';
    state.tag = '';
    state.q = '';
    if (input) input.value = '';
    apply();
    syncUrl();
  });

  root.classList.add('work-hub--live');
  apply();
}
