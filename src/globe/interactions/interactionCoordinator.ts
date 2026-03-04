export class InteractionCoordinator {
    private focusedIso: string | null = null;
    private selectedIso: string | null = null;
    private currentIso: string | null = null;

    constructor (
        private highlight: (iso: string | null) => void
    ) {}

    setFocused(iso: string | null) {
        this.focusedIso = iso;
        this.sync();
    }

    setSelected(iso: string | null) {
        this.selectedIso = iso;
        this.sync();
    }

    clearSelected() {
        this.selectedIso = null;
        this.sync();
    }

    clearAll() {
        this.selectedIso = null;
        this.focusedIso = null;
        this.sync();
    }

    private sync() {
        const nextIso = this.selectedIso ?? this.focusedIso;
        if (nextIso === this.currentIso) return;

        this.currentIso = nextIso;
        this.highlight(nextIso);
    }

}