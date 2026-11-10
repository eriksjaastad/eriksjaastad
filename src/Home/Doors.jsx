import React from 'react';

// Six doors down one dark hall. Each is drawn to its own room: what it's made of, and the light that leaks out of it.
// Every drawing shares one box (220 x 340) with the floor at y=290, so the doors stand on one line whatever their shape.
// Hover and focus styles (the door opening a crack, its light coming up) live in Home.css.

const FLOOR = 290;

// The light a room throws on the hall floor, widening as it leaves the door.
function Pool({ id, from, to, color, strength = 0.5, spread = 30 }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={strength} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="pool" d={`M${from} ${FLOOR}H${to}L${to + spread} 340H${from - spread}Z`} fill={`url(#${id})`} />
    </>
  );
}

// Filters every door borrows: a soft bloom for anything lit, and the pebbling on the office glass.
export function HallDefs() {
  return (
    <svg className="hall-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="bloom-s" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="pebble" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .05  0 0 0 1.5 -.62" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
}

// Memory: a bulkhead hatch. Through the porthole, the graph turns slowly.
const NODES = [
  [0, 0, 5.2, '#ff6a00'], [-19, -13, 2.6, '#ffb08a'], [17, -18, 2.2, '#ff8a3d'], [24, 6, 3, '#ffb08a'], [-25, 9, 2.2, '#ff8a3d'],
  [-8, 23, 2.8, '#ffd0b0'], [12, 22, 1.9, '#ff8a3d'], [-12, -27, 1.6, '#ffd0b0'], [30, -9, 1.5, '#ffd0b0'], [-31, -6, 1.5, '#ffb08a'],
  [5, -30, 1.4, '#ff8a3d'], [26, 21, 1.4, '#ffd0b0'], [-22, 25, 1.3, '#ff8a3d'],
];
const LINKS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 7], [2, 8], [4, 9], [2, 10], [3, 11], [5, 12], [1, 4], [3, 6]];
const BOLTS = Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6 + 0.26) * 73, Math.sin(i * Math.PI / 6 + 0.26) * 73]);

export function MemoryDoor() {
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true">
      <defs>
        <radialGradient id="mem-glass"><stop offset="0" stopColor="#3a1608" /><stop offset=".7" stopColor="#170b08" /><stop offset="1" stopColor="#0c0808" /></radialGradient>
        <radialGradient id="mem-halo"><stop offset="0" stopColor="#ff6a00" stopOpacity=".55" /><stop offset="1" stopColor="#ff6a00" stopOpacity="0" /></radialGradient>
        <clipPath id="mem-port"><circle cx="110" cy="178" r="40" /></clipPath>
      </defs>
      <Pool id="mem-pool" from={66} to={154} color="#ff6a00" strength={0.6} />
      {/* the bulkhead it's set in */}
      <rect x="22" y="78" width="176" height="212" rx="16" fill="#23262e" />
      <rect x="22.5" y="78.5" width="175" height="211" rx="15.5" fill="none" stroke="#3b404c" />
      {[[36, 92], [184, 92], [36, 276], [184, 276]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#454b58" />)}
      <rect x="20" y="130" width="20" height="14" rx="3" fill="#3a3f4b" /><rect x="20" y="212" width="20" height="14" rx="3" fill="#3a3f4b" />
      {/* the hatch */}
      <circle className="halo" cx="110" cy="178" r="96" fill="url(#mem-halo)" opacity=".5" />
      <circle cx="110" cy="178" r="80" fill="#343946" />
      <circle cx="110" cy="178" r="79.5" fill="none" stroke="#515868" />
      <g transform="translate(110 178)">{BOLTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#1c1f26" />)}</g>
      <circle cx="110" cy="178" r="66" fill="#282c36" />
      <circle cx="110" cy="178" r="65.5" fill="none" stroke="#1a1d24" />
      {/* the porthole */}
      <circle cx="110" cy="178" r="46" fill="#4b5262" />
      <circle cx="110" cy="178" r="40" fill="url(#mem-glass)" />
      <g clipPath="url(#mem-port)">
        <circle className="lit" cx="110" cy="178" r="26" fill="#ff6a00" opacity=".3" filter="url(#bloom)" />
        <g transform="translate(110 178)">
          <g className="orbit">
            {LINKS.map(([a, b], i) => <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="#ff6a00" strokeOpacity=".5" strokeWidth=".8" />)}
            <circle r="9.5" fill="none" stroke="#ff8a3d" strokeOpacity=".7" strokeWidth="1.1" />
            {NODES.map(([x, y, r, c], i) => <circle key={i} cx={x} cy={y} r={r} fill={c} />)}
          </g>
        </g>
        <path d="M82 158a40 40 0 0 1 30-20" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="110" cy="178" r="43" fill="none" stroke="#69718296" strokeWidth="1" />
      {/* the lever that throws the bolts */}
      <g className="lever">
        <rect x="158" y="150" width="9" height="56" rx="4.5" fill="#596070" />
        <rect x="160" y="152" width="2.5" height="52" rx="1.2" fill="#7b8496" opacity=".6" />
      </g>
      <circle cx="162.5" cy="178" r="5" fill="#3a3f4b" />
    </svg>
  );
}

// Case studies: an office door after hours, the desk lamp still on behind the pebbled glass.
export function CaseDoor() {
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true">
      <defs>
        <linearGradient id="case-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9cf96" /><stop offset="1" stopColor="#b98f52" /></linearGradient>
        <radialGradient id="case-lamp" cx=".3" cy=".86" r=".75"><stop offset="0" stopColor="#fff6d6" stopOpacity=".95" /><stop offset="1" stopColor="#fff6d6" stopOpacity="0" /></radialGradient>
      </defs>
      <Pool id="case-pool" from={50} to={170} color="#f0cf8e" strength={0.5} />
      <rect x="36" y="34" width="148" height="256" fill="#2a221d" />
      <rect x="36.5" y="34.5" width="147" height="255" fill="none" stroke="#3d322a" />
      {/* the transom */}
      <rect x="46" y="43" width="128" height="20" fill="url(#case-glass)" opacity=".5" />
      <rect x="46" y="43" width="128" height="20" fill="#000" opacity=".25" filter="url(#pebble)" />
      <path d="M110 43v20" stroke="#2a221d" strokeWidth="3" />
      {/* the room behind, seen when the door gives */}
      <rect x="46" y="72" width="128" height="218" fill="#f3d9a0" />
      <g className="leaf" style={{ transformOrigin: '46px 180px' }}>
        <rect x="46" y="72" width="128" height="218" fill="#412d21" />
        <rect x="46.5" y="72.5" width="127" height="217" fill="none" stroke="#573d2d" />
        <rect x="58" y="84" width="104" height="124" fill="url(#case-glass)" />
        <rect className="lit" x="58" y="84" width="104" height="124" fill="url(#case-lamp)" opacity=".75" />
        <rect x="58" y="84" width="104" height="124" fill="#000" filter="url(#pebble)" />
        <rect x="58.5" y="84.5" width="103" height="123" fill="none" stroke="#241811" strokeWidth="1.5" />
        {/* sign-painter's lettering on the glass */}
        <g fill="#231710" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" textAnchor="middle">
          <path d="M76 110h68" stroke="#231710" strokeWidth="1.4" />
          <text x="111" y="136" fontSize="22" letterSpacing="5">CASE</text>
          <text x="110.5" y="160" fontSize="17" letterSpacing="2.5">STUDIES</text>
          <path d="M76 171h68M92 176h36" stroke="#231710" strokeWidth="1.4" />
        </g>
        <rect x="58" y="222" width="104" height="54" fill="#39271c" />
        <rect x="58.5" y="222.5" width="103" height="53" fill="none" stroke="#2a1c14" />
        <path d="M59 275.5h102" stroke="#55402f" />
        <circle cx="165" cy="214" r="5" fill="#b89243" /><circle cx="163.6" cy="212.6" r="1.6" fill="#ecd391" />
      </g>
      <rect className="lit" x="48" y="287.5" width="124" height="2.5" fill="#ffe7b0" opacity=".85" />
    </svg>
  );
}

// GitHub: the steel door out to the workshop. Its window is a year of commits, one pane a day.
const YEAR = [
  '012100231', '100321012', '231040120', '013214301', '120032143', '301201020', '010120301',
].map(r => [...r].map(Number));
const GREENS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

export function GithubDoor() {
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true">
      <Pool id="gh-pool" from={52} to={168} color="#2ea043" strength={0.5} />
      {/* the sign over it: this one leaves the house */}
      <path d="M96 44v8M124 44v8" stroke="#2c3037" strokeWidth="2" />
      <rect x="76" y="20" width="68" height="25" rx="3" fill="#0c120e" stroke="#1f2a22" />
      <text className="lit" x="111.5" y="38.5" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="15" letterSpacing="3.5" textAnchor="middle" fill="#39d353" filter="url(#bloom-s)" opacity=".8">EXIT</text>
      <text x="111.5" y="38.5" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="15" letterSpacing="3.5" textAnchor="middle" fill="#7ee895">EXIT</text>
      <rect x="38" y="52" width="144" height="238" fill="#1f2228" />
      <rect x="38.5" y="52.5" width="143" height="237" fill="none" stroke="#343841" />
      <rect x="46" y="60" width="128" height="230" fill="#2ea043" />
      <g className="leaf" style={{ transformOrigin: '46px 180px' }}>
        <rect x="46" y="60" width="128" height="230" fill="#2b2f36" />
        <rect x="46.5" y="60.5" width="127" height="229" fill="none" stroke="#3d424c" />
        <rect x="52" y="70" width="116" height="94" rx="3" fill="#0d1117" />
        <g transform="translate(56.4 74.6)">
          {YEAR.map((row, r) => row.map((v, c) => (
            <rect key={`${r}-${c}`} className={v === 4 ? 'day hot' : 'day'} x={c * 12.4} y={r * 12.4} width="10" height="10" rx="2" fill={GREENS[v]} style={{ animationDelay: `${((r * 5 + c * 3) % 9) * -0.9}s` }} />
          )))}
        </g>
        {/* the push bar */}
        <rect x="52" y="204" width="116" height="16" rx="3" fill="#1f2228" />
        <rect className="bar" x="56" y="207" width="108" height="10" rx="5" fill="#59606d" />
        <rect x="60" y="209" width="100" height="2" rx="1" fill="#8a93a3" opacity=".5" />
        {/* the kick plate */}
        <rect x="52" y="254" width="116" height="30" fill="#363b44" />
        {[[57, 259], [163, 259], [57, 279], [163, 279]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#22252b" />)}
      </g>
    </svg>
  );
}

// The gallery: tall double doors under a pediment, left ajar. The checkered floor shows through.
export function GalleryDoor() {
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true">
      <defs>
        <linearGradient id="gal-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8e7fb5" /><stop offset=".75" stopColor="#f1ebff" /><stop offset="1" stopColor="#fff" /></linearGradient>
        <linearGradient id="gal-spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e6dcff" stopOpacity=".75" /><stop offset="1" stopColor="#e6dcff" stopOpacity="0" /></linearGradient>
        <pattern id="gal-check" width="20" height="16" patternUnits="userSpaceOnUse" patternTransform="translate(110 290) skewX(-18)">
          <rect width="10" height="8" fill="#0d0c10" /><rect x="10" y="8" width="10" height="8" fill="#0d0c10" />
        </pattern>
        <clipPath id="gal-wedge"><path d="M100 290H120L168 340H52Z" /></clipPath>
      </defs>
      {/* the wedge of gallery light on the hall floor, checks and all */}
      <g className="pool" clipPath="url(#gal-wedge)">
        <rect x="40" y="290" width="140" height="50" fill="url(#gal-spill)" />
        <rect x="40" y="290" width="140" height="50" fill="url(#gal-check)" opacity=".45" />
      </g>
      <path d="M20 44L110 12L200 44Z" fill="#2a2532" />
      <path d="M20.8 43.5L110 12.6L199.2 43.5" fill="none" stroke="#443d50" />
      <rect x="24" y="44" width="172" height="12" fill="#322c3b" />
      <rect x="30" y="56" width="160" height="234" fill="#25212c" />
      <rect x="30.5" y="56.5" width="159" height="233" fill="none" stroke="#3a3445" />
      <rect x="40" y="64" width="140" height="226" fill="url(#gal-room)" />
      {[0, 1].map(side => {
        const x = side ? 117 : 40;
        return (
          <g key={side} className={side ? 'leaf right' : 'leaf left'} style={{ transformOrigin: `${side ? 180 : 40}px 180px` }}>
            <rect x={x} y="64" width="63" height="226" fill="#2e2838" />
            <rect x={x + 0.5} y="64.5" width="62" height="225" fill="none" stroke="#453d53" />
            <rect x={x + 9} y="76" width="45" height="94" fill="none" stroke="#1f1b27" strokeWidth="1.5" />
            <rect x={x + 10.5} y="77.5" width="42" height="91" fill="none" stroke="#3f384c" strokeWidth=".8" />
            <rect x={x + 9} y="184" width="45" height="94" fill="none" stroke="#1f1b27" strokeWidth="1.5" />
            <rect x={x + 10.5} y="185.5" width="42" height="91" fill="none" stroke="#3f384c" strokeWidth=".8" />
            <rect x={side ? 121.5 : 95} y="158" width="3.5" height="44" rx="1.7" fill="#c9a24a" />
            {/* the light catching the edge that faces the gap */}
            <rect x={side ? 117 : 100.5} y="64" width="2.5" height="226" fill="#efe7ff" opacity=".5" />
          </g>
        );
      })}
    </svg>
  );
}

// Websites: a shop door with the sign switched on.
export function ShopDoor() {
  const stripes = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true">
      <defs>
        <clipPath id="shop-awning"><path d="M34 34H186L202 68H18Z" /></clipPath>
        <linearGradient id="shop-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101617" /><stop offset="1" stopColor="#3b2a1f" /></linearGradient>
      </defs>
      <Pool id="shop-pool" from={54} to={166} color="#ff7d8e" strength={0.45} />
      {/* the awning */}
      <g clipPath="url(#shop-awning)">
        {stripes.map(i => <rect key={i} x={18 + i * 20.5} y="34" width="20.5" height="34" fill={i % 2 ? '#b9ad97' : '#8a3b30'} />)}
        <rect x="18" y="34" width="184" height="34" fill="#000" opacity=".28" />
        <rect x="18" y="34" width="184" height="6" fill="#000" opacity=".25" />
      </g>
      {stripes.map(i => <path key={i} d={`M${18 + i * 20.45} 68h20.45a10.2 9 0 0 1 -20.45 0Z`} fill={i % 2 ? '#8b8271' : '#662c24'} />)}
      <rect x="42" y="78" width="136" height="212" fill="#172325" />
      <rect x="42.5" y="78.5" width="135" height="211" fill="none" stroke="#2b3d40" />
      <rect x="50" y="86" width="120" height="204" fill="#ffb27a" />
      <g className="leaf" style={{ transformOrigin: '50px 180px' }}>
        <rect x="50" y="86" width="120" height="204" fill="#22474a" />
        <rect x="50.5" y="86.5" width="119" height="203" fill="none" stroke="#356669" />
        <rect x="60" y="96" width="94" height="138" fill="url(#shop-in)" />
        <rect x="60.5" y="96.5" width="93" height="137" fill="none" stroke="#132829" strokeWidth="1.5" />
        {/* the sign, hung on two chains */}
        <path d="M84 97v29M130 97v29" stroke="#55605f" strokeWidth="1" />
        <rect x="68" y="126" width="78" height="42" rx="9" fill="#0b0d10" opacity=".7" />
        <g className="sign">
          <rect x="72" y="130" width="70" height="34" rx="7" fill="none" stroke="#5ed0d8" strokeWidth="5" opacity=".5" filter="url(#bloom-s)" />
          <text x="108.5" y="155" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="20" letterSpacing="3" textAnchor="middle" fill="#ff4d6a" filter="url(#bloom-s)">OPEN</text>
          <rect x="72" y="130" width="70" height="34" rx="7" fill="none" stroke="#c9f6fa" strokeWidth="1.8" />
          <text x="108.5" y="155" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="20" letterSpacing="3" textAnchor="middle" fill="#ffd3da">OPEN</text>
        </g>
        <path d="M64 226L98 100M74 230L116 100" stroke="#fff" strokeOpacity=".05" strokeWidth="6" />
        <rect x="60" y="244" width="94" height="36" fill="#1d3d40" />
        <rect x="60.5" y="244.5" width="93" height="35" fill="none" stroke="#163033" />
        <rect x="159" y="150" width="4" height="50" rx="2" fill="#c7c0ad" />
      </g>
      <rect className="lit" x="52" y="287.5" width="116" height="2.5" fill="#ffc7a8" opacity=".7" />
    </svg>
  );
}

// Flashback: the cabin's plank door, drawn in the same chunky pixels as the maze outside it.
const ZIGS = ['#ff3d7f', '#2ecc71', '#ffd23f', '#ff3d7f', '#2ecc71'];

export function CabinDoor() {
  return (
    <svg viewBox="0 0 220 340" aria-hidden="true" shapeRendering="crispEdges">
      <Pool id="cabin-pool" from={56} to={164} color="#ffab3d" strength={0.55} />
      <rect x="40" y="56" width="136" height="234" fill="#2a1a10" />
      <rect x="48" y="64" width="120" height="226" fill="#ffb347" />
      <g className="leaf" style={{ transformOrigin: '48px 180px' }}>
        {[0, 1, 2, 3, 4].map(i => <rect key={i} x={48 + i * 24} y="64" width="24" height="226" fill={['#6a4426', '#5c3a20', '#6f4829', '#5c3a20', '#674225'][i]} />)}
        {[1, 2, 3, 4].map(i => <rect key={i} x={46 + i * 24} y="64" width="4" height="226" fill="#3b2414" />)}
        <rect x="48" y="84" width="120" height="16" fill="#4a2d18" /><rect x="48" y="84" width="120" height="4" fill="#7a5230" />
        <rect x="48" y="244" width="120" height="16" fill="#4a2d18" /><rect x="48" y="244" width="120" height="4" fill="#7a5230" />
        {/* four panes with the fire going behind them */}
        <rect x="80" y="116" width="56" height="56" fill="#2a1a10" />
        <rect className="pane a" x="84" y="120" width="22" height="22" fill="#ffd27a" /><rect className="pane b" x="110" y="120" width="22" height="22" fill="#ffb347" />
        <rect className="pane b" x="84" y="146" width="22" height="22" fill="#ffb347" /><rect className="pane a" x="110" y="146" width="22" height="22" fill="#ff9a2e" />
        <rect x="88" y="124" width="4" height="4" fill="#fff3c4" /><rect x="114" y="124" width="4" height="4" fill="#ffe1a0" />
        {/* an iron thumb latch */}
        <rect x="150" y="188" width="4" height="36" fill="#1a1008" />
        <rect x="146" y="184" width="12" height="8" fill="#1a1008" /><rect x="146" y="220" width="12" height="8" fill="#1a1008" />
        <rect x="154" y="200" width="8" height="4" fill="#1a1008" />
      </g>
      {/* the snowboard from inside, left out against the wall */}
      <g transform="rotate(5 196 290)">
        <rect x="184" y="150" width="20" height="140" fill="#4a4a5c" /><rect x="188" y="146" width="12" height="4" fill="#4a4a5c" />
        <rect x="186" y="150" width="16" height="138" fill="#1c1c26" /><rect x="190" y="148" width="8" height="2" fill="#1c1c26" />
        {ZIGS.map((c, i) => (
          <g key={i} fill={c}>
            <rect x="186" y={170 + i * 22} width="4" height="4" /><rect x="190" y={166 + i * 22} width="4" height="4" />
            <rect x="194" y={170 + i * 22} width="4" height="4" /><rect x="198" y={166 + i * 22} width="4" height="4" />
            <rect x="186" y={174 + i * 22} width="4" height="2" opacity=".5" /><rect x="194" y={174 + i * 22} width="4" height="2" opacity=".5" />
          </g>
        ))}
      </g>
      <rect x="36" y="282" width="144" height="8" fill="#3a3632" /><rect x="36" y="282" width="144" height="4" fill="#57514b" />
    </svg>
  );
}
