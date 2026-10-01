// The page's words. index.html repeats them in <noscript>; keep both in sync.

export const NAME = { first: 'Tony', last: 'Mastromarino' };

/**
 * Menu links, top to bottom. `offset` is the word's horizontal shift as a
 * multiple of the link font size, from the original 64px design grid.
 * `landscapeScale` narrows the first word's overhang in landscape only, as
 * the original composition did. `alignEdge` pins a word's solid left stroke
 * to the viewport edge.
 *
 * @typedef {{
 *   label: string,
 *   href: string,
 *   offset: number,
 *   landscapeScale?: number,
 *   alignEdge?: 'left',
 * }} Link
 * @type {Link[]}
 */
export const LINKS = [
  {
    label: 'github',
    href: 'https://github.com/tonydoesathing',
    offset: -13 / 64,
    landscapeScale: 0.9,
    alignEdge: 'left',
  },
  { label: 'resume', href: '/TonyMastromarinoResume.pdf', offset: 41 / 64 },
  { label: 'email', href: 'mailto:mastromarino.tony@gmail.com', offset: 174 / 64 },
];
