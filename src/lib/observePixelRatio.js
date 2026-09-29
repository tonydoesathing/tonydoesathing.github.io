// Moving a window between displays can change DPR without changing its CSS size.
export function observePixelRatio(onChange) {
  let query;
  function listen() {
    query?.removeEventListener('change', changed);
    query = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    query.addEventListener('change', changed);
  }
  function changed() {
    listen();
    onChange();
  }
  listen();
  return () => query.removeEventListener('change', changed);
}
