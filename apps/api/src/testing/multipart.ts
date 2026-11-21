/** Corps multipart portant un seul fichier dans le champ `file`. */
export function fileForm(
  bytes: Buffer,
  filename = 'a.png',
  type = 'image/png',
): FormData {
  const body = new FormData();
  body.append('file', new File([new Uint8Array(bytes)], filename, { type }));
  return body;
}
