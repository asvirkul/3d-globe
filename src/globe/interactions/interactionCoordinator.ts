export class InteractionCoordinator {
    private pendingIso: string | null = null;
    private pendingTime = 0;

    private focusedIso: string | null = null;
    private selectedIso: string | null = null;
    private currentIso: string | null = null;
    
    private readonly focusDelayMs = 100;
    private readonly nullDelayMs = 200;

    
    constructor (
        private highlight: (iso: string | null) => void,
    ) {}

    setFocused(iso: string | null): void {
        const now = performance.now();

        if (iso !== this.pendingIso) {
            this.pendingIso = iso;
            this.pendingTime = now;
            return;
        }

        const delay = iso === null ? this.nullDelayMs : this.focusDelayMs;
        if (now - this.pendingTime < delay) return;

        this.focusedIso = iso;
        this.sync();
    }

    setSelected(iso: string | null): void {
        this.selectedIso = iso;
        this.sync();
    }

    clearSelected(): void {
        this.selectedIso = null;
        this.sync();
    }

    clearAll(): void {
        this.selectedIso = null;
        this.focusedIso = null;
        this.pendingIso = null;
        this.pendingTime = 0;
        this.sync();
    }

    private sync(): void {
        const nextIso = this.selectedIso ?? this.focusedIso;
        if (nextIso === this.currentIso) return;

        this.currentIso = nextIso;
        this.highlight(nextIso);
    }

}