type UmamiEventValue = string | number | boolean;
type UmamiEventData = Record<string, UmamiEventValue>;

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: UmamiEventData) => void;
    };
  }
}

export function trackUmamiEvent(name: string, data?: UmamiEventData): void {
  if (typeof window === 'undefined' || !window.umami) return;
  window.umami.track(name, data);
}
