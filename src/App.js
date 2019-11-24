import React, { Component } from 'react';
import './App.css';
import gerrymender from './img/gerrymender.jpg';
import indulge from './img/indulge.png';
import redfin from './img/redfin.jpg';
import hemexcel from './img/hemexcel.png';
import siscoTh from './img/siscoTh.png';
import brainCancer from './img/brainCancer.jpg';
import seaTimesTh from './img/seaTimesTh.jpg';
import theMartinTh from './img/theMartinTh.jpg';
import chrisElliottFund from './img/chrisElliottFund.jpg';
import Erik_Sjaastad from "./pdf/Erik_Sjaastad.pdf";

class App extends Component {
  render() {
    return (
      <div className="App">
        <header id="top">
          <nav>
            <ul className="group" role="navigation">
                <li><a href="#projects">Projects</a></li>
                <li><a href={Erik_Sjaastad} rel="noopener noreferrer" target="_blank">Resume</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
          </nav>
        </header>

        <section id="featured" className="about group">
          <h1 className="name">Erik <span className="lname">Sjaastad</span> <span className="nowrap">(pronounced "shaw-stad" in English)</span></h1>
          <h2 className="social">
            <a href="https://github.com/eriksjaastad">GitHub</a> ||
            <a href="http://www.linkedin.com/in/erikodin/">LinkedIn</a> ||
            <a href="mailto:erik@logicdesigns.com">Email</a>
          </h2>
        </section>

        <section id="projects" className="projects group">
          <article className="group">
            <h2>Site Development</h2>
            <a href="https://redfin.com"><img src={redfin} alt="Redfin" width="298px" height="373px" /></a>
            <ul>
              <li>Create reusable React components and stores consuming a RESTful resource in the Reflux pattern</li>
              <li>Large customer facing projects:</li>
              <li>
                <ul>
                  <li><a href="https://www.redfin.com/why-redfin">Why Redfin 5 pages</a>: Duration 3 months</li>
                  <li><a href="https://www.redfin.com/about/jobs">Jobs 15 pages</a>: Duration 3 months</li>
                </ul>
              </li>
              <li>Worked closely with designers to set design standards for all new designs</li>
              <li>Tech stack: React, Flux, JSX, ES6, CommonJS, AMD, Babel, Webpack, Gulp, ESLint and NPM</li>
            </ul>
          </article>
        </section>

        <section id="class-projects" className="projects group">
          <article className="group">
            <h2>App Development</h2>
            <a href="https://gerrymender.herokuapp.com/"><img src={gerrymender} alt="Gerrymender" width="298px" /></a>
            <p>This web application encourages users to explore the issue of gerrymandering via an interactive map of US congressional districts and data from the US Census and other sources.</p>
            <ul>
              <li>Designed and built React component architecture</li>
              <li>Calculations, formatting, and display of data from census API</li>
              <li>The front end: React, govtrack API, censusreporter API, openstreetmap API</li>
              <li>Languages: JavaScript, HTML, CSS</li>
            </ul>
            <p><a href="https://github.com/ccoltrera/gerrymander">Project Repository</a></p>
          </article>

          <article className="group">
            <h2>App Development</h2>
            <a href="https://goindulge.herokuapp.com/#/"><img src={indulge} alt="Indulge" width="298px" height="298px" /></a>
            <p>Real time map of tweets in Seattle. See if something big is going on near you (right now it's only for Seattle but we'll be updating it soon)</p>
            <ul>
              <li>The back end: Node, Express, MongoDB, Twitter API, Socket.IO</li>
              <li>The front end: Angular, Google Maps API, JQueryUI Map</li>
              <li>Languages: JavaScript, HTML, SASS</li>
            </ul>
            <p><a href="https://goindulge.herokuapp.com/#/">Indulge</a></p>
            <p><a href="https://github.com/eriksjaastad/indulge">Project Repository</a></p>
          </article>
        </section>

        <section id="projects" className="projects group">
          <article className="group">
            <h2>Site Design and Development</h2>
            <a href="http://hemexcel.org"><img src={hemexcel} alt="HemeXcel" width="298px" height="298px" /></a>
            <p>This is an ongoing project for HemeXcel. The main challenge was time, 7 days start to finish. I tried to keep a clean corporate feel with a lot of white space.  WordPress, JavaScript, HTML, CSS, _S theme, SuperFish.js, Font Awesome</p>
            <p><a href="http://hemexcel.org">HemeXcel</a></p>
          </article>

          <article className="group">
            <h2>Presentation Development</h2>
            <a href="sisco/"><img src={siscoTh} alt="Sisco presentation screenshot" width="298px" height="298px" /></a>
            <p>Cisco - Offline presentation</p>
            <p>This project was very interesting. The technical challenges were to create an offline app which would behave like an app and have presentation components. The team consisted of a designer and two developers. We used a custom JavaScript MVC framework. Each view had several cases, depending on where the presenter was in the presentation there was a specific state for the view, this allowed the person back stage to use the arrow keys to go back and forth in the story and the click events were also liked to certain states of each view. JavaScript, HTML, CSS</p>
            <p><a href="sisco/">See part of the presentation<br />
              (use the arrow keys for navigation)</a></p>
          </article>

          <article className="group">
            <h2>Site Design and Development</h2>
            <a href="http://braincancer.org/"><img src={brainCancer} alt="BrainCancer.org screenshot" width="298px" height="298px" /></a>
            <p>BrainCancer.Org - Pro bono</p>
            <p>The wonderful people at the Swedish Neuroscience Institute contacted me to see if I could help with their website. The goal is to have a responsive design that is easy for the user to navigate and deliver up-to-date brain cancer information to the people who need it. For the doctors and staff, it needs to be easy to manage so we chose to stay with WordPress but make sure all content can be updated or added through regular posts. WordPress, JavaScript, HTML, CSS _S theme, Google Fonts, SuperFish.js, Font Awesome, Masonry</p>
            <p><a href="http://braincancer.org/">BrainCancer.Org</a></p>
          </article>

          <article className="group">
            <h2>UX</h2>
            <img src={seaTimesTh} alt="Seattle Times screenshot" width="298px" height="298px" />
            <p>The Seattle Times</p>
            <p>I helped build the new log in system and account center and helped implement the LiveFyre commenting system. My primary tasks were to work with the design team and make sure their designs came out pixel perfect and with the development team, making sure all the forms and user data were pulling correctly. PHP, JavaScript, HTML, CSS</p>
          </article>

          <article className="group">
            <h2>Site Development</h2>
              <a href="http://themartinseattle.com"><img src={theMartinTh} alt="The Martin screenshot" width="298px" height="298px" /></a>
              <p>The Martin Seattle</p>
              <p>This project pulls in information from the property management API and uses it to activate highlights on the building image and the floor plans. If a unit is not available the highlight will be deactivated. All of the details of each unit is pulled in from the API. JSON, jQuery, JavaScript, PHP, HTML and CSS. Plugin's used: Imagemapster, ColorBox</p>
              <p><a href="http://themartinseattle.com">The Martin</a></p>
          </article>

          <article className="group">
            <h2>Site Development</h2>
            <a href="http://chriselliottfund.org/"><img src={chrisElliottFund} alt="Chris Elliott Fund" width="298px" height="298px" /></a>
            <p>Chris Elliott Fund - Pro bono</p>
            <p>They needed some help getting the site organized. I updated their WordPress template so the site is now responsive and we worked together to organize their content and UI in a more logical manner. WordPress, HTML, CSS</p>
            <p><a href="http://chriselliottfund.org/">Chris Elliott Fund</a></p>
          </article>
        </section>

        <footer id="contact">
          <a href="mailto:erik@logicdesigns.com">Email Me: erik@logicdesigns.com</a>
        </footer>
      </div>
    );
  }
}

export default App;
