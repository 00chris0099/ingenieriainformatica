/**
 * Pure helpers for the builder's window-order persistence.
 * The menu order lives in the navbar `links` array; these functions
 * extract and re-apply that order so it can survive page reloads.
 */

/**
 * Reorders navbar links to match a stored window-id order.
 * Links whose windowId is not in the stored order are pushed to the end,
 * keeping their original relative order (stable sort).
 */
export function reorderLinksByStoredOrder(links: any[], order: string[]): any[] {
  return links.slice().sort((a, b) => {
    const ia = order.indexOf(String(a?.windowId))
    const ib = order.indexOf(String(b?.windowId))
    const ra = ia === -1 ? order.length + 1000 : ia
    const rb = ib === -1 ? order.length + 1000 : ib
    return ra - rb
  })
}

/**
 * Extracts the ordered window ids from navbar links, excluding
 * special links (whatsapp, product landings) and empty ids.
 */
export function windowIdsFromLinks(links: any[]): string[] {
  return links
    .map((l: any) => String(l?.windowId || ''))
    .filter(id => id && id !== 'whatsapp' && !id.startsWith('product:'))
}
