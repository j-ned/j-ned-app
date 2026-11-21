import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const injectIsBrowser = (): boolean => isPlatformBrowser(inject(PLATFORM_ID));
