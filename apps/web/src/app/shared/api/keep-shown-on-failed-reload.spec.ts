import { ApplicationRef, EnvironmentInjector, type ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { Subject, type Observable } from 'rxjs';
import { keepShownOnFailedReload } from './keep-shown-on-failed-reload';

type Reads = { readonly answer: (value: string) => void; readonly fail: () => void };

// Chaque lecture de la ressource est une source pilotée à la main.
function shownList(): { readonly list: ResourceRef<string | undefined>; readonly reads: Reads[] } {
  const reads: Reads[] = [];
  const read = (): Observable<string> => {
    const source = new Subject<string>();
    reads.push({
      answer: (value) => {
        source.next(value);
        source.complete();
      },
      fail: () => source.error(new Error('lecture en échec')),
    });
    return source;
  };
  const list: ResourceRef<string | undefined> = TestBed.inject(EnvironmentInjector).runInContext(
    () => rxResource({ stream: () => read().pipe(keepShownOnFailedReload(list)) }),
  );
  return { list, reads };
}

function lastRead(reads: readonly Reads[]): Reads {
  const read = reads.at(-1);
  if (!read) throw new Error('aucune lecture lancée');
  return read;
}

async function settle(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
}

describe('keepShownOnFailedReload', () => {
  it('Given a value shown When its reload fails Then the value stays and no error is shown', async () => {
    const { list, reads } = shownList();
    TestBed.tick();
    lastRead(reads).answer('avant');
    await settle();

    list.reload();
    TestBed.tick();
    lastRead(reads).fail();
    await settle();

    expect({ status: list.status(), value: list.hasValue() ? list.value() : null }).toEqual({
      status: 'resolved',
      value: 'avant',
    });
  });

  it('Given a value shown When its reload succeeds Then the new value is shown', async () => {
    const { list, reads } = shownList();
    TestBed.tick();
    lastRead(reads).answer('avant');
    await settle();

    list.reload();
    TestBed.tick();
    lastRead(reads).answer('après');
    await settle();

    expect(list.hasValue() ? list.value() : null).toBe('après');
  });

  it('Given nothing shown yet When the first read fails Then the error is shown', async () => {
    const { list, reads } = shownList();
    TestBed.tick();

    lastRead(reads).fail();
    await settle();

    expect(list.status()).toBe('error');
  });
});
