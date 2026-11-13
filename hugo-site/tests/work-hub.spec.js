const { test, expect } = require('@playwright/test');

// The Work hub (/work/) is the one place to find posts and projects.
// Scenarios are written Given / When / Then; see layouts/section/work.html
// and themes/frontier/assets/js/work-hub.js.

const visibleCards = (page) => page.locator('[data-work-item]:not([hidden])');

test.describe('Work hub: posts and projects in one place', () => {
  test('Given the hub, when it loads, then every kind is listed together and long series are folded into one card', async ({ page }) => {
    const res = await page.goto('/work/');
    expect(res.status()).toBe(200);
    await expect(page.locator('[data-work-hub]')).toHaveClass(/work-hub--live/);

    // Posts and projects sit in the same list.
    await expect(visibleCards(page).filter({ has: page.locator('.work-kind--build') }).first()).toBeAttached();
    await expect(visibleCards(page).filter({ has: page.locator('.work-kind--pov') }).first()).toBeAttached();

    // A folded series shows its hub card, which lists the parts; the parts' own cards stay hidden.
    await expect(page.locator('[data-series-part]:not([hidden])')).toHaveCount(0);
    expect(await page.locator('[data-series-part]').count()).toBeGreaterThan(3);
    await expect(page.locator('.work-parts summary').first()).toContainText('in this series');
  });

  test('Given the hub, when the reader picks "Case studies", then only case studies remain and the URL can be shared', async ({ page }) => {
    await page.goto('/work/');
    await page.locator('[data-kind-chip="case-study"]').click();

    await expect(page).toHaveURL(/\/work\/\?kind=case-study$/);
    await expect(page.locator('[data-kind-chip="case-study"]')).toHaveAttribute('aria-pressed', 'true');
    const kinds = await visibleCards(page).evaluateAll((cards) => cards.map((card) => card.dataset.kind));
    expect(kinds.length).toBeGreaterThan(0);
    expect(new Set(kinds)).toEqual(new Set(['case-study']));

    // The shared URL opens in the same state.
    await page.goto('/work/?kind=case-study');
    await expect(page.locator('[data-kind-chip="case-study"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(visibleCards(page)).toHaveCount(kinds.length);
  });

  test('Given a folded series, when the reader searches for one of its parts, then that part is shown on its own', async ({ page }) => {
    await page.goto('/work/');
    await page.locator('[data-work-search]').fill('cybersecurity');

    const part = page.locator('[data-series-part]:not([hidden])');
    await expect(part).toHaveCount(1);
    await expect(part.locator('.work-card__title')).toContainText('Cybersecurity');
    await expect(page.locator('[data-work-status]')).toContainText('Showing');
  });

  test('Given filters that match nothing, when the reader clears them, then the full list returns', async ({ page }) => {
    await page.goto('/work/');
    const total = await visibleCards(page).count();
    await page.locator('[data-work-search]').fill('no-such-topic-anywhere');
    await expect(page.locator('[data-work-empty]')).toBeVisible();

    await page.locator('[data-work-clear]').click();
    await expect(page.locator('[data-work-empty]')).toBeHidden();
    await expect(visibleCards(page)).toHaveCount(total);
  });

  test('Given the old list URLs, when they are opened, then the reader lands on the hub with the filter kept', async ({ page }) => {
    await page.goto('/blog/?tag=architecture');
    await expect(page).toHaveURL(/\/work\/\?tag=architecture$/);
    await expect(page.locator('[data-work-topic]')).toContainText('architecture');
    expect(await visibleCards(page).count()).toBeGreaterThan(0);

    await page.goto('/projects/');
    await expect(page).toHaveURL(/\/work\/\?kind=build$/);
    await expect(page.locator('[data-kind-chip="build"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Given an article in a series, when it is opened, then the reader can see where they are and where to go next', async ({ page }) => {
    await page.goto('/blog/2026/03/travel_n_transport/day-03-budgetary-cycles/');

    const seriesNav = page.locator('.series-nav');
    await expect(seriesNav).toContainText('Part 3 of');
    await expect(seriesNav.locator('a[rel="prev"]')).toHaveAttribute('href', /day-02/);
    await expect(seriesNav.locator('a[rel="next"]')).toHaveAttribute('href', /day-04/);

    const keepReading = page.locator('.keep-reading');
    await expect(keepReading.locator('.keep-reading__item').first()).toContainText('Next in this series');
    await expect(keepReading.locator('.keep-reading__all')).toHaveAttribute('href', /\/work\/$/);
    await expect(page.locator('.post-meta .work-kind')).toHaveAttribute('href', /\/work\/\?kind=industry$/);
  });
});
