const { test, expect } = require('@playwright/test');

// Social links come from [[params.socialIcons]] in hugo.toml and render in the
// footer (every page), the desktop header (1024px and up) and llms.txt.

const YOUTUBE = 'https://youtube.com/@build2understand';

test.describe('Social links', () => {
  test('Given any page, when the reader reaches the footer, then the Build2Understand YouTube channel is linked', async ({ page }) => {
    for (const path of ['/', '/work/', '/about/']) {
      await page.goto(path);
      const link = page.locator('.site-footer a[href="' + YOUTUBE + '"]');
      await expect(link).toHaveCount(1);
      await expect(link).toContainText('YouTube');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('Given a desktop screen, when the page loads, then the header offers the YouTube channel next to GitHub', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The header icon row is desktop-only; phones get the footer link.');
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    const icon = page.locator('.desktop-top-nav a[href="' + YOUTUBE + '"]');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('aria-label', 'YouTube: Build2Understand');
  });

  test('Given an AI agent, when it reads llms.txt, then the channel is listed by name', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('- YouTube: ' + YOUTUBE + ' (Build2Understand: Software engineering through practice)');
  });
});
