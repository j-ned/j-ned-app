import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  it.each([
    { bytes: 0, size: '0 o' },
    { bytes: 512, size: '512 o' },
    { bytes: 1023, size: '1023 o' },
    { bytes: 1024, size: '1 Ko' },
    { bytes: 77_824, size: '76 Ko' },
    { bytes: 1_048_064, size: '1 Mo' },
    { bytes: 1_048_576, size: '1 Mo' },
    { bytes: 1_258_291, size: '1,2 Mo' },
  ])('Given $bytes bytes When formatted Then it reads « $size »', ({ bytes, size }) => {
    expect(formatFileSize(bytes)).toBe(size);
  });
});
