export class VisibleTimeMeter {
  private _accumulated = 0;
  private _visibleSince: number | null = null;

  start(now: number, visible: boolean): void {
    this._accumulated = 0;
    this._visibleSince = visible ? now : null;
  }

  pause(now: number): void {
    if (this._visibleSince === null) return;
    this._accumulated += now - this._visibleSince;
    this._visibleSince = null;
  }

  resume(now: number): void {
    this._visibleSince ??= now;
  }

  drain(now: number): number {
    const wasVisible = this._visibleSince !== null;
    this.pause(now);
    const drained = this._accumulated;
    this._accumulated = 0;
    if (wasVisible) this._visibleSince = now;
    return drained;
  }
}
