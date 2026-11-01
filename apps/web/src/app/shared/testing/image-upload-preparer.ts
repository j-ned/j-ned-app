import type { Provider } from '@angular/core';
import { of } from 'rxjs';
import {
  IMAGE_UPLOAD_PREPARER,
  type ImageUploadPreparer,
} from '@shared/upload/image-upload-preparer';

// happy-dom ne décode ni n'encode d'image : les tests de gateway fixent la préparation.
export const provideImageUploadPreparer = (
  preparer: ImageUploadPreparer = (file) => of(file),
): Provider => ({ provide: IMAGE_UPLOAD_PREPARER, useValue: preparer });
