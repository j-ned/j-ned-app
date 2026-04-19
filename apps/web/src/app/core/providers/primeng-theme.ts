import { providePrimeNG } from 'primeng/config';
import type { EnvironmentProviders } from '@angular/core';
import { portfolioPreset } from '@core/theme/prime-preset';

export function providePrimeNGTheme(): EnvironmentProviders {
  return providePrimeNG({
    theme: {
      preset: portfolioPreset,
      options: {
        darkModeSelector: '.app-dark',
      },
    },
  });
}
