import { onTestFinished } from 'vitest';

// happy-dom expose toujours `navigator.clipboard` : le test le retire pour simuler une page qui n'y a pas accès.
export function withdrawClipboard(): void {
  const ownDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => undefined });
  onTestFinished(() => {
    if (ownDescriptor) {
      Object.defineProperty(navigator, 'clipboard', ownDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
}
