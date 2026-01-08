import { expect, type Page } from '@playwright/test';

/**
 * Navigation helpers for common routes in the Admin SPA
 */
export class Navigator {
  constructor(private page: Page) {}

  async goToLogin(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/\/login$/, { timeout: 10_000 });
  }

  async goToDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(this.page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToAnalytics(): Promise<void> {
    await this.page.goto('/analytics');
    await expect(this.page).toHaveURL(/\/analytics$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToHeatmap(): Promise<void> {
    await this.page.goto('/heatmap');
    await expect(this.page).toHaveURL(/\/heatmap$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToAdmins(): Promise<void> {
    await this.page.goto('/admins');
    await expect(this.page).toHaveURL(/\/admins$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToProducts(): Promise<void> {
    await this.page.goto('/products');
    await expect(this.page).toHaveURL(/\/products$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToOrders(): Promise<void> {
    await this.page.goto('/orders');
    await expect(this.page).toHaveURL(/\/orders$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToArticles(): Promise<void> {
    await this.page.goto('/articles');
    await expect(this.page).toHaveURL(/\/articles$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToFaqs(): Promise<void> {
    await this.page.goto('/faqs');
    await expect(this.page).toHaveURL(/\/faqs$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToDeals(): Promise<void> {
    await this.page.goto('/deals');
    await expect(this.page).toHaveURL(/\/deals$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToCompliance(): Promise<void> {
    await this.page.goto('/compliance');
    await expect(this.page).toHaveURL(/\/compliance$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToLegal(): Promise<void> {
    await this.page.goto('/legal');
    await expect(this.page).toHaveURL(/\/legal$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToTheme(): Promise<void> {
    await this.page.goto('/theme');
    await expect(this.page).toHaveURL(/\/theme$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToPersonalization(): Promise<void> {
    await this.page.goto('/personalization');
    await expect(this.page).toHaveURL(/\/personalization$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToSettings(): Promise<void> {
    await this.page.goto('/settings');
    await expect(this.page).toHaveURL(/\/settings$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  async goToUndo(): Promise<void> {
    await this.page.goto('/undo');
    await expect(this.page).toHaveURL(/\/undo$/, { timeout: 10_000 });
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded (DOM + network)
   */
  private async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
    // Give React time to hydrate
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate using the Suite Map dropdown menu
   */
  async navigateViaSuiteMap(pageName: string): Promise<void> {
    // Click the Suite Map button to open dropdown
    const suiteMapButton = this.page.locator('button:has-text("Suite Map"), button:has-text("☰")').first();
    await suiteMapButton.click();
    
    // Wait for dropdown to appear
    await this.page.waitForTimeout(300);
    
    // Click the desired page
    const pageLink = this.page.locator(`a:has-text("${pageName}")`).first();
    await pageLink.click();
    
    // Wait for navigation
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
  }

  /**
   * Check if current page has expected heading
   */
  async expectHeading(text: string | RegExp): Promise<void> {
    const heading = this.page.locator('h1, h2').filter({ hasText: text }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Wait for API response before navigation
   */
  async waitForApiResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 15_000 }
    );
  }
}
