import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const reports = [];
async function scan(name) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  reports.push({
    name,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  });
}
try {
  await page.goto("http://localhost:3000");
  await expect(
    page.getByRole("switch", { name: "Enable Caveman" }),
  ).toBeEnabled();
  await scan("desktop overview");
  await page.screenshot({
    path: "station-test-results/overview-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Explore all agents", exact: true })
    .click();
  await scan("station library");
  await page.getByRole("button", { name: "Create agent", exact: true }).click();
  await scan("agent editor dialog");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await scan("light settings");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await scan("dark settings");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await scan("dark overview");
  await page.setViewportSize({ width: 390, height: 844 });
  await scan("mobile dark overview");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await scan("mobile light overview");
  await page.screenshot({
    path: "station-test-results/overview-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
} finally {
  await browser.close();
}
console.log(JSON.stringify(reports, null, 2));
process.exitCode = reports.some((r) => r.violations.length) ? 1 : 0;
