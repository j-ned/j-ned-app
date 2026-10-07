export async function captureCrash(action: () => Promise<void>): Promise<unknown> {
  try {
    await action();
    return null;
  } catch (error: unknown) {
    return error;
  }
}
