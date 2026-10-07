import type { ComponentFixture } from '@angular/core/testing';

export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

// Une ressource en attente (`NEVER`) laisse la fixture instable : la macro-tâche borne l'attente.
export async function settleBounded(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let pass = 0; pass < 2; pass++) {
    fixture.detectChanges();
    await Promise.race([
      fixture.whenStable(),
      new Promise<void>((resolve) => setTimeout(resolve, 0)),
    ]);
  }
  fixture.detectChanges();
}
