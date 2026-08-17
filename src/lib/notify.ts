/** צלצול והתראות מובייל - סגנון וואטסאפ */

const STORAGE_KEY = "hs-sound-enabled";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  if (on) audioCtx();
}

function tone(at: number, freq: number, duration: number, gain: number) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ac.currentTime + at);
  vol.gain.setValueAtTime(0.0001, ac.currentTime + at);
  vol.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + duration + 0.02);
}

/** צלצול קבלת הודעה/הזמנה 🔔 */
export function playIncomingChime() {
  if (!isSoundEnabled()) return;
  tone(0, 1046.5, 0.16, 0.22);
  tone(0.13, 1396.9, 0.22, 0.2);
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([40, 60, 40]);
}

/** צליל שליחת הודעה */
export function playOutgoingTick() {
  if (!isSoundEnabled()) return;
  tone(0, 880, 0.09, 0.13);
}

/** מפעיל את מנוע השמע אחרי מגע ראשון של המשתמש (דרישת דפדפני מובייל) */
export function unlockAudio() {
  audioCtx();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function showMobileNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", dir: "rtl", lang: "he" });
  } catch {
    /* ignore */
  }
}
