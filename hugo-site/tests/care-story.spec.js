const { test, expect } = require('@playwright/test');

// The CARE scroll story on the home page: copy steps scroll past a pinned canvas.
// Scenarios are written Given / When / Then; see layouts/partials/care-story.html
// and themes/frontier/assets/js/care-story.js. `?story=debug` shows the reading
// line and the playhead, which is what these scenarios read.

const steps = (page) => page.locator('[data-care-story] [data-kf]');

/** Scroll so that step `index` sits on the story's reading line. */
async function bringToReadingLine(page, index) {
  // The line moves once the stage pins, so settle in a few passes.
  for (let pass = 0; pass < 4; pass += 1) {
    await page.evaluate((i) => {
      const line = document.querySelector('.care-story__line').getBoundingClientRect().top;
      const step = document.querySelectorAll('[data-care-story] [data-kf]')[i];
      const rect = step.getBoundingClientRect();
      window.scrollBy(0, rect.top + rect.height / 2 - line);
    }, index);
    await page.waitForTimeout(150);
  }
}

test.describe('CARE scroll story', () => {
  test('Given the home page, when it loads, then the story has one step per CARE move followed by work from the field', async ({ page }) => {
    const res = await page.goto('/');
    expect(res.status()).toBe(200);
    await expect(page.locator('[data-care-story]')).toHaveClass(/care-story--live/);

    for (const [kf, word] of [[1, 'Clarity'], [2, 'Alignment'], [3, 'Reality'], [4, 'Execution']]) {
      await expect(page.locator(`[data-care-story] [data-kf="${kf}"] .care-story__heading`)).toContainText(word);
    }
    const field = page.locator('[data-care-story] [data-story-title]');
    expect(await field.count()).toBeGreaterThan(0);
    await expect(field.first()).toHaveAttribute('data-story-metric', /.+/);
    await expect(field.first().locator('a').first()).toHaveAttribute('href', /\/(blog|projects)\//);
  });

  test('Given the story, when a step reaches the reading line, then it becomes active and the stage plays to its keyframe', async ({ page }) => {
    await page.goto('/?story=debug');
    await bringToReadingLine(page, 3);

    await expect(steps(page).nth(3)).toHaveClass(/is-active/);
    await expect(steps(page).nth(2)).not.toHaveClass(/is-active/);
    // The playhead travels to keyframe 3 and the render loop then parks.
    await expect(page.locator('.care-story__hud')).toContainText(/playhead\s+3\.00/, { timeout: 10000 });
    await expect(page.locator('.care-story__hud')).toContainText(/render loop\s+parked/);

    const painted = await page.locator('[data-care-canvas]').evaluate((canvas) => {
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
      return false;
    });
    expect(painted).toBe(true);
  });

  test('Given the reader has scrolled ahead, when they scroll back up, then the story rewinds to the earlier step', async ({ page }) => {
    await page.goto('/?story=debug');
    await bringToReadingLine(page, 4);
    await expect(page.locator('.care-story__hud')).toContainText(/playhead\s+4\.00/, { timeout: 10000 });

    await bringToReadingLine(page, 1);
    await expect(steps(page).nth(1)).toHaveClass(/is-active/);
    await expect(page.locator('.care-story__hud')).toContainText(/playhead\s+1\.00/, { timeout: 10000 });
  });

  test('Given the story, when the reader skips it, then they land on the latest work', async ({ page }) => {
    await page.goto('/');
    await page.locator('.care-story__skip').click();
    await expect(page.locator('#latest-work .section-title')).toBeInViewport();
    expect(await page.locator('#latest-work [data-work-item]').count()).toBeGreaterThan(0);
  });
});
