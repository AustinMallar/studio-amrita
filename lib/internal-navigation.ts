export function isInternalNavigation(anchor: HTMLAnchorElement, pathname: string): boolean {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const next = `${url.pathname}${url.search}`;
    const current = `${pathname}${window.location.search}`;
    return next !== current;
  } catch {
    return false;
  }
}

export function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}
