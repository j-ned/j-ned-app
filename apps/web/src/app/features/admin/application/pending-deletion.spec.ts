import { ApplicationRef, type WritableResource } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { of, Subject, type Observable } from 'rxjs';
import { PendingDeletion } from './pending-deletion';

type Item = { readonly id: string; readonly label: string };

const A: Item = { id: 'a', label: 'Alpha' };
const B: Item = { id: 'b', label: 'Bravo' };
const C: Item = { id: 'c', label: 'Charlie' };

type Harness = {
  readonly list: WritableResource<readonly Item[] | undefined>;
  readonly deletion: PendingDeletion<Item>;
  readonly answers: Map<string, Subject<void>>;
  readonly succeeded: ReturnType<typeof vi.fn>;
  readonly failed: ReturnType<typeof vi.fn>;
};

async function makeHarness(items: readonly Item[]): Promise<Harness> {
  const answers = new Map<string, Subject<void>>();
  const succeeded = vi.fn();
  const failed = vi.fn();
  const { list, deletion } = TestBed.runInInjectionContext(() => {
    const list = rxResource({ stream: () => of(items) });
    const deletion = new PendingDeletion<Item>({
      list,
      remove: (item): Observable<void> => {
        const answer = new Subject<void>();
        answers.set(item.id, answer);
        return answer;
      },
      succeeded,
      failed,
    });
    return { list, deletion };
  });
  await TestBed.inject(ApplicationRef).whenStable();
  return { list, deletion, answers, succeeded, failed };
}

const ids = (list: WritableResource<readonly Item[] | undefined>): readonly string[] =>
  (list.value() ?? []).map((item) => item.id);

const succeed = (harness: Harness, id: string): void => {
  harness.answers.get(id)?.next();
  harness.answers.get(id)?.complete();
};

const fail = (harness: Harness, id: string): void =>
  harness.answers.get(id)?.error(new Error('down'));

describe('PendingDeletion: demande et confirmation', () => {
  it('Given a requested item When it is cancelled Then nothing is targeted and nothing is removed', async () => {
    const harness = await makeHarness([A, B]);

    harness.deletion.request(B);
    const requested = harness.deletion.target();
    harness.deletion.cancel();

    expect({
      requested,
      target: harness.deletion.target(),
      sent: [...harness.answers.keys()],
      list: ids(harness.list),
    }).toEqual({ requested: B, target: null, sent: [], list: ['a', 'b'] });
  });

  it('Given a requested item When it is confirmed Then it leaves the list at once, before the answer', async () => {
    const harness = await makeHarness([A, B, C]);
    harness.deletion.request(B);

    harness.deletion.confirm();

    expect({
      target: harness.deletion.target(),
      sent: [...harness.answers.keys()],
      list: ids(harness.list),
      succeeded: harness.succeeded.mock.calls.length,
    }).toEqual({ target: null, sent: ['b'], list: ['a', 'c'], succeeded: 0 });
  });

  it('Given nothing requested When confirm is called Then nothing is removed', async () => {
    const harness = await makeHarness([A]);

    harness.deletion.confirm();

    expect({ sent: [...harness.answers.keys()], list: ids(harness.list) }).toEqual({
      sent: [],
      list: ['a'],
    });
  });
});

describe('PendingDeletion: réponse du serveur', () => {
  it('Given a deletion in flight When the server acknowledges it Then the item stays gone and success is reported for it', async () => {
    const harness = await makeHarness([A, B, C]);
    harness.deletion.delete(B);

    succeed(harness, 'b');

    expect({
      list: ids(harness.list),
      succeeded: harness.succeeded.mock.calls,
      failed: harness.failed.mock.calls.length,
    }).toEqual({ list: ['a', 'c'], succeeded: [[B]], failed: 0 });
  });

  it('Given a deletion in flight When the server refuses it Then the item comes back at its place and the failure is reported for it', async () => {
    const harness = await makeHarness([A, B, C]);
    harness.deletion.delete(B);

    fail(harness, 'b');

    expect({
      list: ids(harness.list),
      failed: harness.failed.mock.calls,
      succeeded: harness.succeeded.mock.calls.length,
    }).toEqual({ list: ['a', 'b', 'c'], failed: [[B]], succeeded: 0 });
  });

  it.each([
    { refused: 'a', acknowledged: 'b', list: ['a', 'c'] },
    { refused: 'b', acknowledged: 'a', list: ['b', 'c'] },
    { refused: 'c', acknowledged: 'b', list: ['a', 'c'] },
  ])(
    'Given two deletions in flight When $acknowledged is acknowledged then $refused refused Then only $refused comes back',
    async ({ refused, acknowledged, list }) => {
      const harness = await makeHarness([A, B, C]);
      const byId = new Map([A, B, C].map((item) => [item.id, item]));
      harness.deletion.delete(byId.get(refused) ?? A);
      harness.deletion.delete(byId.get(acknowledged) ?? A);

      succeed(harness, acknowledged);
      fail(harness, refused);

      expect(ids(harness.list)).toEqual(list);
    },
  );

  it('Given an item the list no longer holds When its deletion is refused Then it is not added back', async () => {
    const harness = await makeHarness([A, B]);
    harness.deletion.delete(C);

    fail(harness, 'c');

    expect({ list: ids(harness.list), failed: harness.failed.mock.calls }).toEqual({
      list: ['a', 'b'],
      failed: [[C]],
    });
  });
});
