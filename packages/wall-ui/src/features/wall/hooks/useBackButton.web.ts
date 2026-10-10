/**
 * A browser has no Back button to catch and a page can't close itself. The keyboard adapter
 * sends Escape and Backspace as the remote's `back` command, which closes the spotlight.
 */
export const useBackButton: (onBack: () => boolean) => void = () => undefined;

export const exitApp = () => undefined;
