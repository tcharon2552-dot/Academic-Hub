import { expect, test } from "@playwright/test";

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
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("Name").fill("E2E Researcher");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Research workspace" })).toBeVisible();
  await expect(page.getByText("Current plan A0 / Free Credits")).toBeVisible();
  await expect(page.getByText("30")).toBeVisible();
  await expect(page.getByRole("link", { name: "Writing polish" })).toBeVisible();

  await page.getByRole("link", { name: "Writing polish" }).click();
  await expect(page).toHaveURL(/\/workflows\/writing-polish$/);
  await expect(page.getByRole("heading", { name: "Academic paragraph editing" })).toBeVisible();
});

test("registered user can create a self-serve A2 payment order", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByLabel("Email").fill(`buyer-${Date.now()}@example.com`);
  await page.getByLabel("Name").fill("E2E Buyer");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Research workspace" })).toBeVisible();

  await page.getByRole("link", { name: "Manage plan" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await page.getByRole("link", { name: "Choose A2" }).click();

  await expect(page).toHaveURL(/\/billing\?plan=A2$/);
  await expect(page.getByRole("heading", { name: "Complete A2 checkout" })).toBeVisible();
  await expect(page.getByText("RMB 69-129 / month")).toBeVisible();

  await page.getByRole("button", { name: "Create Alipay order" }).click();

  await expect(page.getByText("Payment order created.")).toBeVisible();
  await expect(page.getByText("A2 · ALIPAY · RMB 69")).toBeVisible();
  await expect(page.getByText("PENDING")).toBeVisible();
});
