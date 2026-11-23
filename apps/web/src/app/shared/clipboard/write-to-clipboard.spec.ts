import { writeToClipboard } from './write-to-clipboard';
import { withdrawClipboard } from '@shared/testing/clipboard-availability';

const LINK =
  'https://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics';

describe('writeToClipboard', () => {
  beforeEach(async () => {
    await navigator.clipboard.writeText('avant');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given a clipboard that accepts the text When it is written Then the exact text is in the clipboard and the copy is reported done', async () => {
    const copied = await writeToClipboard(LINK);

    expect({ copied, clipboard: await navigator.clipboard.readText() }).toEqual({
      copied: true,
      clipboard: LINK,
    });
  });

  it('Given a clipboard that refuses the text When it is written Then the copy is reported failed without throwing, and the clipboard is untouched', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('The request is not allowed', 'NotAllowedError'),
    );

    const copied = await writeToClipboard(LINK);

    expect({ copied, clipboard: await navigator.clipboard.readText() }).toEqual({
      copied: false,
      clipboard: 'avant',
    });
  });

  it('Given a page without clipboard access When the text is written Then the copy is reported failed without throwing', async () => {
    withdrawClipboard();

    await expect(writeToClipboard(LINK)).resolves.toBe(false);
  });
});
