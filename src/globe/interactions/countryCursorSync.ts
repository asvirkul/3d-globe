export type CountryCursorSyncOptions = {
  dom: HTMLElement;
  pickLabelIso: (clientX: number, clientY: number) => string | null;
  pickPinIso: (clientX: number, clientY: number) => string | null;
  canInteract?: () => boolean;
};

export class CountryCursorSync {
  private readonly abort = new AbortController();

  constructor(private options: CountryCursorSyncOptions) {
    this.options.dom.addEventListener('pointermove', this.onMove, {
      signal: this.abort.signal,
    });

    this.options.dom.addEventListener('pointerleave', this.onLeave, {
      signal: this.abort.signal,
    });
  }

  public dispose(): void {
    this.abort.abort();
    this.options.dom.style.cursor = 'default';
  }

  private onMove = (e: PointerEvent): void => {
    if (this.options.canInteract?.() === false) {
      this.options.dom.style.cursor = 'default';
      return;
    }

    const pinIso = this.options.pickPinIso(e.clientX, e.clientY);
    const labelIso = this.options.pickLabelIso(e.clientX, e.clientY);

    this.options.dom.style.cursor = pinIso || labelIso ? 'pointer' : 'default';
  };

  private onLeave = (): void => {
    this.options.dom.style.cursor = 'default';
  };
}
