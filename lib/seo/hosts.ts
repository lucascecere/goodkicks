/** True when the request came in on Good Kicks' own domain. */
export function isGoodKicksHost(host: string | null | undefined): boolean {
  const h = (host ?? '').toLowerCase().split(':')[0];
  return h === 'goodkicks.co' || h === 'www.goodkicks.co';
}
