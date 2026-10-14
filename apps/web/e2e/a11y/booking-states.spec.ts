import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, FOOTER_READY, THEMES } from './scenarios';
import type { Locator, Page } from '@playwright/test';

const PARIS_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const CALENDAR_DAY_STATES = [
  'past',
  'closed-period',
  'closed',
  'holiday',
  'open',
  'empty',
] as const;

type UpcomingBookings = {
  readonly data: readonly { readonly startsAt: string; readonly status: string }[];
};

async function openAvailability(page: Page, visit: (path: string) => Promise<void>): Promise<void> {
  await visit('/admin/disponibilites');
  await expect(page.getByTestId('admin-calendar-grid')).toBeVisible();
  await expect(page.getByTestId('admin-slot-grid')).toBeVisible();
  await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
}

function calendarDay(page: Page, date: string): Locator {
  return page.locator(`[data-testid="admin-calendar-day"][data-date="${date}"]`);
}

// Les boutons radio des jours et des heures sont visuellement masqués : on clique leur étiquette.
async function chooseFirstDayAndTime(page: Page): Promise<void> {
  await page
    .locator('label', { has: page.getByTestId('booking-day-option') })
    .first()
    .click();
  await page
    .locator('label', { has: page.getByTestId('booking-time-option') })
    .first()
    .click();
  await expect(page.getByTestId('booking-summary')).toBeVisible();
}

for (const theme of THEMES) {
  test.describe(`Prise de rendez-vous · thème ${theme}`, () => {
    test.use({ theme });

    test.describe('visiteur', () => {
      test.beforeEach(async ({ page, visit }) => {
        await visit('/rendez-vous');
        await expect(page.getByTestId(FOOTER_READY)).toBeVisible();
        await expect(page.getByTestId('booking-day-picker')).toBeVisible();
      });

      test('chosen day and time has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await expectNoA11yViolations('booking-summary', 'creneau-choisi');
      });

      test('empty details submitted has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await page.getByTestId('booking-submit').click();
        await expect(page.getByTestId('booking-name-error')).toBeVisible();
        await expect(page.getByTestId('booking-email-error')).toBeVisible();
        await expect(page.getByTestId('booking-message-error')).toBeVisible();
        await expectNoA11yViolations('booking-name-error', 'formulaire-soumis-vide');
      });

      test('confirmation screen has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await page.getByTestId('booking-name').fill('Claire Martin');
        await page.getByTestId('booking-email').fill('claire.martin@atelier-exemple.test');
        await page.getByTestId('booking-message').fill('Site vitrine pour notre atelier.');
        await page.getByTestId('booking-submit').click();
        await expect(page.getByTestId('booking-confirmation-heading')).toBeFocused();
        await expectNoA11yViolations('booking-confirmation', 'confirmation');
      });
    });

    test.describe('admin', () => {
      test.use({ adminSession: true });

      test('open booking cancellation dialog has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/rendez-vous');
        await expect(page.getByTestId('admin-booking-row')).toHaveCount(3);
        await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
        await page.getByTestId('admin-booking-cancel').first().click();
        await expect(page.locator('dialog[open]')).toHaveCount(1);
        await expect(page.getByTestId('admin-booking-reason')).toBeVisible();
        await expectNoA11yViolations('confirm-dialog', 'dialogue-annulation-ouvert');
      });

      test.describe('disponibilités', () => {
        test('calendar month showing every day state has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          await openAvailability(page, visit);
          for (const state of CALENDAR_DAY_STATES) {
            await expect(
              page.locator(`[data-testid="admin-calendar-day"][data-state="${state}"]`).first(),
            ).toBeVisible();
          }
          await expect(
            page.locator('[data-testid="admin-calendar-day"][data-date$="-09"]'),
          ).toHaveAttribute('aria-label', /rouvert/);
          await expect(
            page.locator('[data-testid="admin-calendar-day"][aria-current="date"]'),
          ).toHaveCount(1);
          await expectNoA11yViolations('admin-calendar-grid', 'calendrier-tous-etats');
        });

        test('day closed by hand with its announcement has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          await openAvailability(page, visit);
          const openDay = page
            .locator('[data-testid="admin-calendar-day"][data-state="open"]')
            .first();
          const date = (await openDay.getAttribute('data-date')) ?? '';
          await openDay.click();
          await expect(calendarDay(page, date)).toHaveAttribute('data-state', 'closed');
          await expect(page.getByTestId('admin-calendar-status')).toContainText('Fermé : ');
          await expectNoA11yViolations('admin-calendar-status', 'jour-ferme-a-la-main');
        });

        test('booking warning after closing a booked day has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          const upcoming = page.waitForResponse((response) =>
            response.url().includes('/api/booking/bookings?scope=upcoming'),
          );
          await openAvailability(page, visit);
          const { data } = (await (await upcoming).json()) as UpcomingBookings;
          const booked = data.find((booking) => booking.status === 'confirmed');
          expect(booked, 'la doublure sert un rendez-vous confirmé à venir').toBeDefined();
          const date = PARIS_DATE.format(new Date(booked?.startsAt ?? ''));
          const day = calendarDay(page, date);
          if ((await day.count()) === 0) {
            await page.getByTestId('admin-calendar-next').click();
            await expect(page.getByTestId('admin-calendar-grid')).not.toHaveAttribute(
              'aria-busy',
              'true',
            );
          }
          // Un jour déjà fermé se rouvre d'abord : seule une fermeture donne l'avertissement.
          if (/^(closed|holiday)$/.test((await day.getAttribute('data-state')) ?? '')) {
            await day.click();
            await expect(day).toHaveAttribute('data-state', /^(open|empty)$/);
          }
          await day.click();
          await expect(day).toHaveAttribute('data-state', /^(closed|holiday)$/);
          await expect(page.getByTestId('admin-calendar-booking-warning')).toBeVisible();
          await expect(page.getByTestId('admin-calendar-booking-warning-link')).toHaveAttribute(
            'href',
            '/admin/rendez-vous',
          );
          await expectNoA11yViolations(
            'admin-calendar-booking-warning',
            'avertissement-rendez-vous',
          );
        });

        test('public holidays toggle switched has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          await openAvailability(page, visit);
          const toggle = page.getByTestId('admin-calendar-holidays-toggle');
          await expect(toggle).toHaveAttribute('aria-pressed', 'true');
          await toggle.click();
          await expect(page.getByTestId('admin-calendar-status')).toHaveText(
            'Jours fériés ouverts selon la semaine type.',
          );
          await expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
          await expect(page.getByTestId('admin-calendar-grid')).not.toHaveAttribute(
            'aria-busy',
            'true',
          );
          await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
          await expectNoA11yViolations(
            'admin-calendar-holidays-toggle',
            'interrupteur-feries-bascule',
          );
        });

        test('weekly slots switched on with the save bar has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          await openAvailability(page, visit);
          await page.getByTestId('filter-option').filter({ hasText: 'Mardi' }).click();
          await expect(page.getByTestId('admin-slot-grid-heading')).toHaveText('Créneaux du mardi');
          const slots = page.getByTestId('admin-slot');
          await expect(slots.nth(0)).toHaveAttribute('aria-pressed', 'false');
          await expect(slots.nth(1)).toHaveAttribute('aria-pressed', 'false');
          await slots.nth(0).click();
          await slots.nth(1).click();
          await expect(slots.nth(0)).toHaveAttribute('aria-pressed', 'true');
          await expect(slots.nth(1)).toHaveAttribute('aria-pressed', 'true');
          await expect(page.getByTestId('savebar-state')).toHaveText(
            '1 modification non enregistrée',
          );
          await expectNoA11yViolations('admin-slot-grid', 'pastilles-allumees');
        });
      });
    });
  });
}
