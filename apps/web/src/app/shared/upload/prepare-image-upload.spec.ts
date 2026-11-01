import { MAX_UPLOAD_BYTES } from './upload-limit';
import { UploadRejectedError } from './upload-rejected-error';
import {
  IMAGE_TOO_LARGE,
  IMAGE_UNREADABLE,
  MAX_IMAGE_SIDE,
  prepareImageUpload,
  scaleToFit,
  type DecodedImage,
  type ImageCodec,
  type ImageSize,
} from './prepare-image-upload';

const MIB = 1024 * 1024;

type FakeImage = DecodedImage & { readonly close: ReturnType<typeof vi.fn<() => void>> };

type EncodeCall = { readonly size: ImageSize; readonly quality: number };

const fileOf = (bytes: number, name = 'capture.png', type = 'image/png'): File =>
  new File([new Uint8Array(bytes)], name, { type });

const blobOf = (bytes: number, type = 'image/webp'): Blob =>
  new Blob([new Uint8Array(bytes)], { type });

function fakeCodec(
  dimensions: ImageSize | 'undecodable',
  encodedBytes: (quality: number) => number | null = () => MIB,
): { codec: ImageCodec<FakeImage>; image: FakeImage | null; encodes: EncodeCall[] } {
  const encodes: EncodeCall[] = [];
  const image: FakeImage | null =
    dimensions === 'undecodable' ? null : { ...dimensions, close: vi.fn<() => void>() };
  const codec: ImageCodec<FakeImage> = {
    decode: () => (image ? Promise.resolve(image) : Promise.reject(new Error('undecodable'))),
    encodeWebp: (_image, size, quality) => {
      encodes.push({ size, quality });
      const bytes = encodedBytes(quality);
      return Promise.resolve(bytes === null ? null : blobOf(bytes));
    },
  };
  return { codec, image, encodes };
}

describe('scaleToFit', () => {
  it.each([
    { given: { width: 4800, height: 3200 }, expected: { width: 2400, height: 1600 } },
    { given: { width: 3000, height: 6000 }, expected: { width: 1200, height: 2400 } },
    { given: { width: 1200, height: 800 }, expected: { width: 1200, height: 800 } },
    { given: { width: 2400, height: 2400 }, expected: { width: 2400, height: 2400 } },
    { given: { width: 100_000, height: 10 }, expected: { width: 2400, height: 1 } },
  ])(
    'Given an image of $given.width×$given.height When it is fitted in 2400 px Then it measures $expected.width×$expected.height',
    ({ given, expected }) => {
      expect(scaleToFit(given, MAX_IMAGE_SIDE)).toEqual(expected);
    },
  );
});

describe('prepareImageUpload', () => {
  it.each([
    { bytes: 3 * MIB, size: { width: 2400, height: 1600 } },
    { bytes: MAX_UPLOAD_BYTES, size: { width: 800, height: 2400 } },
  ])(
    'Given an image of $bytes bytes and $size.width×$size.height When it is prepared Then the very same file is sent, untouched',
    async ({ bytes, size }) => {
      const file = fileOf(bytes, 'portrait.jpg', 'image/jpeg');
      const { codec, image, encodes } = fakeCodec(size);

      const prepared = await prepareImageUpload(file, codec);

      expect({
        same: prepared === file,
        encodes: encodes.length,
        closed: image?.close.mock.calls.length,
      }).toEqual({
        same: true,
        encodes: 0,
        closed: 1,
      });
    },
  );

  it('Given a small file wider than 2400 px When it is prepared Then it is scaled to 2400 px and re-encoded as WebP at quality 0.9', async () => {
    const { codec, encodes } = fakeCodec({ width: 6000, height: 4000 }, () => 900_000);

    const prepared = await prepareImageUpload(fileOf(2 * MIB, 'vue.png'), codec);

    expect({
      encodes,
      name: prepared.name,
      type: prepared.type,
      size: prepared.size,
    }).toEqual({
      encodes: [{ size: { width: 2400, height: 1600 }, quality: 0.9 }],
      name: 'vue.webp',
      type: 'image/webp',
      size: 900_000,
    });
  });

  it('Given a file over 4 MiB but small in pixels When it is prepared Then it is re-encoded at its own size, never upscaled', async () => {
    const { codec, encodes } = fakeCodec({ width: 1600, height: 1000 });

    await prepareImageUpload(fileOf(6 * MIB), codec);

    expect(encodes.map(({ size }) => size)).toEqual([{ width: 1600, height: 1000 }]);
  });

  it('Given an encoding still over 4 MiB at high quality When it is prepared Then the quality is lowered step by step until it fits', async () => {
    const sizes: Readonly<Record<number, number>> = { 0.9: 7 * MIB, 0.8: 5 * MIB, 0.7: 3 * MIB };
    const { codec, encodes } = fakeCodec({ width: 2400, height: 2400 }, (q) => sizes[q] ?? MIB);

    const prepared = await prepareImageUpload(fileOf(12 * MIB, 'scan.jpeg', 'image/jpeg'), codec);

    expect({ qualities: encodes.map(({ quality }) => quality), size: prepared.size }).toEqual({
      qualities: [0.9, 0.8, 0.7],
      size: 3 * MIB,
    });
  });

  it('Given an encoding of exactly 4 MiB When it is prepared Then it is accepted', async () => {
    const { codec, encodes } = fakeCodec({ width: 3000, height: 2000 }, () => MAX_UPLOAD_BYTES);

    const prepared = await prepareImageUpload(fileOf(5 * MIB), codec);

    expect({ encodes: encodes.length, size: prepared.size }).toEqual({
      encodes: 1,
      size: MAX_UPLOAD_BYTES,
    });
  });

  it.each([
    { name: 'photo.final.HEIC', expected: 'photo.final.webp' },
    { name: 'sans-extension', expected: 'sans-extension.webp' },
    { name: '.png', expected: 'image.webp' },
  ])(
    'Given a file named « $name » When it is re-encoded Then it is sent as « $expected »',
    async ({ name, expected }) => {
      const { codec } = fakeCodec({ width: 5000, height: 5000 });

      const prepared = await prepareImageUpload(fileOf(5 * MIB, name), codec);

      expect(prepared.name).toBe(expected);
    },
  );

  it('Given a file over 4 MiB that no quality brings under 4 MiB When it is prepared Then it is refused with a French message', async () => {
    const { codec, encodes, image } = fakeCodec({ width: 2400, height: 2400 }, () => 5 * MIB);

    const failure = await prepareImageUpload(fileOf(9 * MIB), codec).catch(
      (error: unknown) => error,
    );

    expect({
      rejected: failure instanceof UploadRejectedError,
      message: failure instanceof Error ? failure.message : null,
      lowestQuality: encodes.at(-1)?.quality,
      closed: image?.close.mock.calls.length,
    }).toEqual({ rejected: true, message: IMAGE_TOO_LARGE, lowestQuality: 0.4, closed: 1 });
  });

  it.each([
    {
      given: 'cannot be decoded',
      codec: (): ImageCodec<FakeImage> => fakeCodec('undecodable').codec,
    },
    {
      given: 'cannot be encoded as WebP',
      codec: (): ImageCodec<FakeImage> =>
        fakeCodec({ width: 3000, height: 3000 }, () => null).codec,
    },
    {
      given: 'makes the encoder throw',
      codec: (): ImageCodec<FakeImage> => ({
        ...fakeCodec({ width: 3000, height: 3000 }).codec,
        encodeWebp: () => Promise.reject(new Error('encoder crashed')),
      }),
    },
  ])(
    'Given a file over 4 MiB that $given When it is prepared Then it is refused with a French message',
    async ({ codec }) => {
      const failure = await prepareImageUpload(fileOf(5 * MIB), codec()).catch(
        (error: unknown) => error,
      );

      expect({
        rejected: failure instanceof UploadRejectedError,
        message: failure instanceof Error ? failure.message : null,
      }).toEqual({ rejected: true, message: IMAGE_UNREADABLE });
    },
  );

  it.each([
    {
      given: 'cannot be decoded',
      codec: (): ImageCodec<FakeImage> => fakeCodec('undecodable').codec,
    },
    {
      given: 'cannot be encoded as WebP',
      codec: (): ImageCodec<FakeImage> =>
        fakeCodec({ width: 3000, height: 3000 }, () => null).codec,
    },
  ])(
    'Given a file under 4 MiB that $given When it is prepared Then it is sent untouched, for the API to judge',
    async ({ codec }) => {
      const file = fileOf(MIB);

      expect(await prepareImageUpload(file, codec())).toBe(file);
    },
  );
});
