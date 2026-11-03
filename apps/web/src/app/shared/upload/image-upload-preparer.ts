import { InjectionToken } from '@angular/core';
import { defer, type Observable } from 'rxjs';
import { BROWSER_IMAGE_CODEC } from './browser-image-codec';
import { prepareImageUpload } from './prepare-image-upload';

// Réduit une image avant son envoi pour qu'elle tienne sous `IMAGE_UPLOAD_TARGET_BYTES`.
// Échoue sur une `UploadRejectedError` quand c'est impossible : aucune requête ne part.
export type ImageUploadPreparer = (file: File) => Observable<File>;

export const IMAGE_UPLOAD_PREPARER = new InjectionToken<ImageUploadPreparer>(
  'IMAGE_UPLOAD_PREPARER',
  {
    providedIn: 'root',
    factory: (): ImageUploadPreparer => (file) =>
      defer(() => prepareImageUpload(file, BROWSER_IMAGE_CODEC)),
  },
);
