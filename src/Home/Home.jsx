import React, { useEffect } from 'react';
import './Home.css';
import { mount } from './intro';

// The loading intro (a year thermometer, 1983 → 2026) hands off to the homepage.
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
        <div className="hero">
          <canvas id="buddy" width="512" height="512" aria-label="The character, grown up into 2026"></canvas>
          <div>
            <h1>Hi, I'm Erik.</h1>
            <p className="say">Sjaastad. Said “shaw-stad.”</p>
            <p>I love programming. Most of what I make started as a tool I wanted for my own work and kept growing. These days that's mostly AI tooling.</p>
          </div>
        </div>
        <nav className="paths" aria-label="Choose a path">
          <a className="path" id="memoryLink" href="/memory/"><b>Inside my AI's memory →</b><small>fly through 2,600 things my agents remember</small></a>
          <a className="path" href="/case-studies/"><b>Case studies →</b><small>agents managing agents, SEO run like client work</small></a>
          <a className="path" href="https://github.com/eriksjaastad"><b>GitHub →</b><small>github.com/eriksjaastad</small></a>
        </nav>
        <div className="timeline" aria-label="Machines">
          <div><b>1983 · TI-99/4A</b>Dad's. TV for a monitor, phone in the coupler.</div>
          <div><b>1992 · Macintosh Classic</b>UW. Papers, mostly.</div>
          <div><b>1990s · Apple IIc</b>Mom's, with the color monitor.</div>
          <div><b>2026 · a lot of agents</b>Still writing tools for myself.</div>
        </div>
        <div className="foot"><span>eriksjaastad.com · 2026 · <a href="https://www.linkedin.com/in/erikodin/">LinkedIn</a></span><button className="ghost" id="replay">Replay intro</button></div>
      </section>
    </>
  );
}
