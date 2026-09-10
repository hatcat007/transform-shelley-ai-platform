import { test, expect } from "@playwright/test";

test("overview, agent discovery, search, filters, load more and prompt library", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good things start here/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use Outbound Strategist", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "station-test-results/overview-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Explore all agents", exact: true })
    .click();
  await expect(page.locator(".library-grid .agent-card")).toHaveCount(18);
  await page
    .getByRole("button", { name: "Discover more", exact: true })
    .click();
  await expect(page.locator(".library-grid .agent-card")).toHaveCount(36);
  await page
    .getByRole("combobox", { name: "Filter category" })
    .selectOption("Finance");
  await expect(page.locator(".library-grid .agent-card")).toHaveCount(9);
  await page.getByRole("textbox", { name: "Search the library" }).fill("cash");
  await expect(page.locator(".library-grid .agent-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Search the library" })
    .fill("no-match-xyz");
  await expect(
    page.getByRole("heading", { name: "No matches just yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("tab", { name: "Prompt library" }).click();
  await expect(page.locator(".library-grid .agent-card")).toHaveCount(18);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search everything" })
    .fill("Outbound");
  await page
    .getByRole("button", { name: "Outbound Strategist Sales · agent" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Outbound Strategist" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Instructions", exact: true }).click();
  await expect(page.locator(".asset-detail pre")).toContainText(
    "Never invent facts",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("create, version, share and persist an agent; create a project", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My agents", exact: true }).click();
  await page.getByRole("button", { name: "Create your first agent" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Test Launch Partner");
  await page
    .getByLabel("A one-line purpose")
    .fill("Turn our launch goal into an actionable campaign.");
  await page
    .getByLabel("Instructions", { exact: true })
    .fill(
      "Ask for our launch date and audience. Produce a launch checklist. Never invent evidence. Human approval is required before publishing.",
    );
  await page.getByRole("button", { name: "Save agent", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Test Launch Partner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit workflow" }).click();
  await page
    .getByLabel("Instructions", { exact: true })
    .fill(
      "Ask for our launch date and audience. Produce a launch checklist and risk register. Never invent evidence. Human approval is required before publishing.",
    );
  await page.getByRole("button", { name: "Save agent", exact: true }).click();
  await page.getByRole("button", { name: "Versions", exact: true }).click();
  await expect(page.locator(".version-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Share workflow publicly" }).click();
  await expect(page.getByRole("textbox", { name: "Share link" })).toBeVisible();
  const url = await page
    .getByRole("textbox", { name: "Share link" })
    .inputValue();
  const share = await page.context().newPage();
  await share.goto(url);
  await expect(
    share.getByRole("heading", { name: "Test Launch Partner" }),
  ).toBeVisible();
  await expect(share.locator("pre")).toContainText("risk register");
  await share.close();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.getByRole("button", { name: "My agents", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Test Launch Partner", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Create your first project" }).click();
  await page.getByLabel("Project name").fill("Autumn Launch");
  await page
    .getByLabel("What are you working toward?")
    .fill("Launch our new product with a focused business plan.");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Autumn Launch" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Work on this project" }).click();
  await expect(page.getByRole("textbox", { name: "YOUR BRIEF" })).toContainText(
    "Autumn Launch",
  );
});

test("settings persist, theme toggles, disconnected runs are truthful", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("switch", { name: "Enable Caveman" }),
  ).toBeEnabled();
  await page.getByRole("switch", { name: "Enable Caveman" }).click();
  await expect(
    page.getByRole("switch", { name: "Enable Caveman" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("WORKSPACE NAME").fill("Independent Studio");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".workspace-switch")).toContainText(
    "Independent Studio",
  );
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "station-test-results/settings-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("switch", { name: "Enable Caveman" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".workspace-switch")).toContainText(
    "Independent Studio",
  );
  await page
    .getByRole("button", { name: "New session", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "YOUR BRIEF" })
    .fill("Create a content plan for a small business.");
  await page
    .getByRole("button", { name: "Let’s get to work", exact: true })
    .click();
  await expect(page.locator(".error-banner[role=alert]")).toContainText(
    "no model is connected",
  );
  await expect(page.locator(".error-banner")).toContainText(
    "Nothing has been sent",
  );
});

test("mobile navigation, responsive layout, help and keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good things start here/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "station-test-results/overview-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "Prompt library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A better place to start." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Help & resources" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("API validation, isolation, version conflicts, share revocation", async ({
  request,
  playwright,
}) => {
  const initial = await request.get("/api/station");
  expect(initial.ok()).toBeTruthy();
  const invalid = await request.post("/api/station", {
    data: { action: "saveAsset", name: "x" },
  });
  expect(invalid.status()).toBe(400);
  const invalidRun = await request.post("/api/station/run", {
    data: { message: "hi" },
  });
  expect(invalidRun.status()).toBe(400);
  const foreign = await request.post("/api/station", {
    headers: { Origin: "https://untrusted.example" },
    data: { action: "project", name: "Should not create", description: "" },
  });
  expect(foreign.status()).toBe(403);
  const base = {
    action: "saveAsset",
    name: "API Validation Agent",
    description: "API isolation and version test.",
    kind: "agent",
    category: "Sales",
    instructions:
      "Use the supplied evidence. Produce a clear action plan. Require human approval for external actions.",
  };
  const create = await request.post("/api/station", { data: base });
  expect(create.status()).toBe(201);
  const asset = await create.json();
  const other = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
  });
  await other.get("/api/station");
  const hidden = await other.get(`/api/station?versions=${asset.id}`);
  expect(hidden.status()).toBe(404);
  const overwrite = await other.post("/api/station", {
    data: { ...base, id: asset.id, version: 1 },
  });
  expect(overwrite.status()).toBe(404);
  const update = await request.post("/api/station", {
    data: { ...base, id: asset.id, version: 1 },
  });
  expect(update.status()).toBe(201);
  const conflict = await request.post("/api/station", {
    data: { ...base, id: asset.id, version: 1 },
  });
  expect(conflict.status()).toBe(409);
  const share = await request.post("/api/station", {
    data: { action: "share", id: asset.id, enabled: true },
  });
  const { token } = await share.json();
  expect((await other.get(`/share/${token}`)).status()).toBe(200);
  await request.post("/api/station", {
    data: { action: "share", id: asset.id, enabled: false },
  });
  expect((await other.get(`/share/${token}`)).status()).toBe(404);
  expect((await request.get("/api/station/session/not-a-uuid")).status()).toBe(
    404,
  );
  const unavailable = await request.post("/api/station/run", {
    data: {
      message: "Create a factual business plan.",
      model: "not-configured",
      mode: "business",
      ponytail: false,
      caveman: false,
    },
  });
  expect(unavailable.status()).toBe(503);
  await other.dispose();
});
