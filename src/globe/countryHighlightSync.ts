type CountryFocusSyncOptions = {
  canInteract: () => boolean;
  highlightBorder: (iso: string | null) => void;
};

type CountryFocusSync = {
  sync: (iso: string | null) => void;
};

export function createCountryFocusSync(options: CountryFocusSyncOptions): CountryFocusSync {
  return {
    sync(iso: string | null): void {
      const visibleIso = options.canInteract() ? iso : null;
      options.highlightBorder(visibleIso);
    },
  };
}
