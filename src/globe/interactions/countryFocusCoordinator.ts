type InteractionCoordinatorHandlers = {
  onFocusChange?: (iso: string | null) => void;
};

export class CountryFocusCoordinator {
  private pendingIso: string | null = null;
  private pendingTime = 0;
  private focusedIso: string | null = null;

  private readonly focusDelayMs = 200;
  private readonly nullDelayMs = 300;

  constructor(private handlers: InteractionCoordinatorHandlers = {}) {}

  public setFocused(iso: string | null): void {
    const now = performance.now();

    if (iso !== this.pendingIso) {
      this.pendingIso = iso;
      this.pendingTime = now;
      return;
    }

    const delay = iso === null ? this.nullDelayMs : this.focusDelayMs;
    if (now - this.pendingTime < delay) return;
    if (iso === this.focusedIso) return;

    this.focusedIso = iso;
    this.handlers.onFocusChange?.(iso);
  }

  public getFocusedIso(): string | null {
    return this.focusedIso;
  }

  public clear(): void {
    this.pendingIso = null;
    this.pendingTime = 0;

    if (this.focusedIso === null) return;
    this.focusedIso = null;
    this.handlers.onFocusChange?.(null);
  }
}
