type VisibilityCallback = (visible: boolean) => void;
const callbacks = new Map<Element, VisibilityCallback>();
let observer: IntersectionObserver | undefined;
let listening = false;

// A single observer covers all reveals and the ambient hero; no scroll handler.
export function observeMotion(element: HTMLElement, callback: VisibilityCallback) {
  if (typeof IntersectionObserver === 'undefined') { callback(true); return () => {}; }
  if (!observer) observer = new IntersectionObserver((entries) => {
    for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting && !document.hidden);
  }, { threshold: 0.08 });
  if (!listening) {
    document.addEventListener('visibilitychange', updateVisibility);
    listening = true;
  }
  callbacks.set(element, callback);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    callbacks.delete(element);
    if (!callbacks.size) {
      observer?.disconnect(); observer = undefined;
      document.removeEventListener('visibilitychange', updateVisibility); listening = false;
    }
  };
}

function updateVisibility() {
  for (const [element, callback] of callbacks) {
    const rect = element.getBoundingClientRect();
    callback(!document.hidden && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight);
  }
}
