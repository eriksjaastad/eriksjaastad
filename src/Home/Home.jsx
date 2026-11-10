import React, { useEffect } from 'react';
import './Home.css';
import { mount } from './intro';
import { HallDefs, MemoryDoor, CaseDoor, GithubDoor, GalleryDoor, ShopDoor, CabinDoor } from './Doors';
import { DOORS } from './hall.js';

// The drawing that goes with each door in hall.js.
const DRAWING = { memory: MemoryDoor, cases: CaseDoor, github: GithubDoor, gallery: GalleryDoor, shop: ShopDoor, cabin: CabinDoor };

// The loading intro (a year thermometer, 1983 → 2026) hands off to the homepage: a hall with six doors.
// Markup is static; intro.js drives it by id, and its cleanup runs on unmount.
export default function Home() {
  useEffect(() => {
    document.body.classList.add('home');
    const unmount = mount();
    return () => {
      unmount();
      document.body.classList.remove('home');
    };
  }, []);

  return (
    <>
      <main id="intro" className="e0" aria-label="Loading intro">
        <div className="bezel">
          <div className="screen scan" id="screen">
            <div className="chrome" id="chrome"></div>
            <canvas id="sprite" width="512" height="512" aria-label="Erik's little monitor character"></canvas>
            <div className="msg" id="msg" aria-live="polite"></div>
          </div>
        </div>
        <div className="meter">
          <div className="meter-top"><span>Loading eriksjaastad.com</span><span id="year">1983</span></div>
          <div className="track"><div id="fill"></div></div>
          <div className="ticks"><span>1983</span><span>1992</span><span>1996</span><span>2003</span><span>2026</span></div>
          <div className="heckles">
            <span>Learn to type.</span><span>Insert disk 2 of 7.</span><span>Don't pick up the phone.</span><span>This bar is lying.</span><span>Thinking…</span>
            <div id="cover"></div>
          </div>
        </div>
        <div className="intro-actions">
          <button className="ghost" id="pause" aria-keyshortcuts="Space">Pause</button>
          <button className="ghost" id="skip">Skip intro</button>
        </div>
      </main>

      <canvas id="motes" aria-hidden="true" hidden></canvas>
      <section id="home" hidden>
        <HallDefs />
        <div className="top">
          <header className="hello">
            <h1>Hi, I'm Erik.</h1>
            <p className="say">Sjaastad. Said “shaw-stad.”</p>
            <p>I love programming. Most of what I make started as a tool I wanted for my own work and kept growing. These days that's mostly AI tooling.</p>
          </header>
          <dl className="machines" aria-label="Machines">
            <div><dt>1983</dt><dd><b>TI-99/4A.</b> Dad's. TV for a monitor, phone in the coupler.</dd></div>
            <div><dt>1992</dt><dd><b>Macintosh Classic.</b> UW. Papers, mostly.</dd></div>
            <div><dt>1990s</dt><dd><b>Apple IIc.</b> Mom's, with the color monitor.</dd></div>
            <div><dt>2026</dt><dd><b>A lot of agents.</b> Still writing tools for myself.</dd></div>
          </dl>
        </div>

        {/* The hall: the character on the left, then six doors. Each door is one link; its caption sits under the floor. */}
        <nav className="hall" aria-label="Six doors">
          <div className="host">
            <div className="art">
              <p className="pick" aria-hidden="true">Six doors.<br />Pick one.</p>
              <canvas id="buddy" width="512" height="512" aria-label="The character, grown up into 2026"></canvas>
            </div>
          </div>
          {DOORS.map(({ id, href, name, about, light }) => {
            const Door = DRAWING[id], [host, path] = about.split('/');
            return (
              <a className={`door ${id}`} id={id === 'memory' ? 'memoryLink' : undefined} href={href} key={id} style={{ '--light': light }}>
                <span className="art"><Door /></span>
                <b>{name}</b>
                {/* an address may wrap after its slash, nowhere else */}
                {path ? <small className="url">{host}/<wbr />{path}</small> : <small>{about}</small>}
              </a>
            );
          })}
        </nav>

        <div className="foot"><span>eriksjaastad.com · 2026 · <a href="https://www.linkedin.com/in/erikodin/">LinkedIn</a></span><button className="replay" id="replay">Replay the intro</button></div>
      </section>
    </>
  );
}
