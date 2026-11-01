import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedChangesGuard, type LeaveConfirmable } from './unsaved-changes-guard';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

const leave = (page: LeaveConfirmable): ReturnType<typeof unsavedChangesGuard> =>
  unsavedChangesGuard(page, ROUTE, STATE, STATE);

describe('unsavedChangesGuard', () => {
  it.each([true, false])(
    'Given a page answering %s When the router asks to leave Then the guard answers the same',
    (answer) => {
      const canLeave = vi.fn(() => answer);

      expect({ answer: leave({ canLeave }), asked: canLeave.mock.calls.length }).toEqual({
        answer,
        asked: 1,
      });
    },
  );

  it('Given a page that asks the admin first When the router asks to leave Then the guard waits for that answer', async () => {
    let answer: (leave: boolean) => void = () => undefined;
    const pending = new Promise<boolean>((resolve) => (answer = resolve));

    const decision = leave({ canLeave: () => pending });
    answer(false);

    expect({ same: decision === pending, resolved: await decision }).toEqual({
      same: true,
      resolved: false,
    });
  });
});
