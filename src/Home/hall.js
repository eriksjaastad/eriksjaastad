// The six doors of the hall, left to right: where each one leads, its caption, and the colour its room throws into the hall.
// Plain data with no JSX, so `yarn test` can check the links; Home.jsx pairs each id with its drawing from Doors.jsx.
export const DOORS = [
  { id: 'memory', href: '/memory/', name: "Inside my AI's memory", about: 'fly through 2,600 things my agents remember', light: '#ff6a00' },
  { id: 'cases', href: '/case-studies/', name: 'Case studies', about: 'agents managing agents, SEO run like client work', light: '#f0cf8e' },
  { id: 'github', href: 'https://github.com/eriksjaastad', name: 'GitHub', about: 'github.com/eriksjaastad', light: '#39d353' },
  { id: 'gallery', href: '/gallery/', name: 'Art gallery', about: 'walk my paintings and drawings in three different spaces', light: '#d9ccff' },
  { id: 'shop', href: '/websites/', name: 'Websites', about: 'sites I built and run', light: '#ff7d8e' },
  { id: 'cabin', href: '/flashback/outside/', name: 'Flashback', about: "a '90s cabin full of the old stuff", light: '#ffab3d' },
];
