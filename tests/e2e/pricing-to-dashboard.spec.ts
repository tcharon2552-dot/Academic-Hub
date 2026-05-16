import { expect, test } from "@playwright/test";

async function continueWithEmail(page: import("@playwright/test").Page, email: string, name?: string) {
  await page.getByLabel("Email").fill(email);

  if (name) {
    await page.getByLabel("Name").fill(name);
  }

  const accessResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/register") && response.status() === 201
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await accessResponse;
  await expect(page.getByRole("heading", { name: "Research workspace" })).toBeVisible();
}

test("visitor can move from pricing to dashboard and writing polish", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Academic Hub" })).toBeVisible();
  await page.getByRole("link", { name: "View plans" }).click();

  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("heading", { name: "Quota-based research plans" })).toBeVisible();

  for (const plan of ["Student Basic", "Research Pro", "Pro Plus", "Lab Starter"]) {
    await expect(page.getByRole("heading", { name: plan })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "Apply for B2" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply for B3" })).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await continueWithEmail(page, `e2e-${Date.now()}@example.com`, "E2E Researcher");

  await expect(page.getByText("Current plan A0 / Free Credits")).toBeVisible();
  await expect(page.getByText("30")).toBeVisible();
  await expect(page.getByRole("link", { name: "Writing polish" })).toBeVisible();

  await page.getByRole("link", { name: "Writing polish" }).click();
  await expect(page).toHaveURL(/\/workflows\/writing-polish$/);
  await expect(page.getByRole("heading", { name: "Academic paragraph editing" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Polish writing" })).toBeEnabled();
  await page.getByLabel("Academic text").fill("This method are good and the result is useful for many tasks.");
  await page.getByLabel("Editing goal").fill("Make it suitable for a journal submission.");
  const workflowResponse = page.waitForResponse(
    (response) => response.url().includes("/api/workflows/writing-polish") && response.status() === 200
  );
  await page.getByRole("button", { name: "Polish writing" }).click();
  await workflowResponse;
  await expect(page.getByLabel("Workflow output")).toContainText("Demo polished draft");

  await page.getByRole("link", { name: "Academic Hub" }).click();
  await expect(page.getByRole("heading", { name: "Recent workflow runs" })).toBeVisible();
  await expect(page.getByText("WRITING_POLISH")).toBeVisible();
  await expect(page.getByText("SUCCEEDED")).toBeVisible();
});

test("registered user can create a self-serve A2 payment order", async ({ page }) => {
  await page.goto("/dashboard");
  await continueWithEmail(page, `buyer-${Date.now()}@example.com`, "E2E Buyer");

  await page.getByRole("link", { name: "Manage plan" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await page.getByRole("link", { name: "Choose A2" }).click();

  await expect(page).toHaveURL(/\/billing\?plan=A2$/);
  await expect(page.getByRole("heading", { name: "Complete A2 checkout" })).toBeVisible();
  await expect(page.getByText("RMB 69-129 / month")).toBeVisible();

  const checkoutResponse = page.waitForResponse(
    (response) => response.url().includes("/api/billing/checkout") && response.status() === 201
  );
  await page.getByRole("button", { name: "Create Alipay order" }).click();
  await checkoutResponse;

  await expect(page.getByText("Payment order created.")).toBeVisible();
  await expect(page.getByText("A2 · ALIPAY · RMB 69")).toBeVisible();
  await expect(page.getByText("PENDING")).toBeVisible();
});

test("registered user can sign out and sign back in with email", async ({ page }) => {
  const email = `returning-${Date.now()}@example.com`;

  await page.goto("/dashboard");
  await continueWithEmail(page, email, "Returning Researcher");

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page.getByRole("heading", { name: "Access your research workspace" })).toBeVisible();
  await continueWithEmail(page, email);

  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Current plan A0 / Free Credits")).toBeVisible();
});
