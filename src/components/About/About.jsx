import React, { Component } from 'react';
import './About.css';

class About extends Component {
  render() {
    return (
      <div className="flex flex-column vh-100 justify-center items-center">
        <h1>
          Live music gives me
          {' '}
          <a href="https://en.wikipedia.org/wiki/Frisson" target="_blank" className="blue link dim">
            frisson
          </a>
          .
        </h1>
        <section className="mw5 mw7-ns center pa3 ph5-ns">
          <p className="lh-copy measure">
            Despite moving to the Bay Area in 2013, I truly didn't start taking advantage of the
            live music scene until 2016 when I met
            {' '}
            <a
              href="https://thisisimportant.net/2018/12/09/my-2018-year-in-music-data-analysis-and-insights/"
              target="_blank"
              className="link underline hover-light-purple"
            >
              Sarah
            </a>
            , found the
            {' '}
            <a
              href="https://www.facebook.com/groups/concertraptor/"
              target="_blank"
              className="link underline hover-light-purple"
            >
              Concert Raptors
            </a>
            {' '}
            group, and started a job that would allow me to better plan where I would be in the
            world months ahead of time.
          </p>
          <p className="lh-copy measure">
            Through these individuals I've become better connected with the music scene and myself
            by seeking out the pleasure that comes with experiencing music live with a concert buddy
            or two or myself.
          </p>
          <p className="lh-copy measure">
            With every new hobby comes a curiosity to see metrics and data at a glance and albeit
            Last.fm can provide a almost complete picture of my listening habits, historical
            artifacts of the shows I've been were spread among ticket stubs, Foursquare check-ins,
            and vague memories of dancing and light shows. Inspired by
            {' '}
            <a
              href="https://tinnitus.robweychert.com/"
              target="_blank"
              className="link underline hover-light-purple"
            >
              Rob Weychert
            </a>
            , I sought out to create a blog to paint a picture of this data for myself and anyone
            else to see.
          </p>
          <p className="lh-copy measure">
            Here's to more dancing, coffee, and
            {' '}
            <a
              href="http://www.flask.com/the-art-of-the-disco-nap-sleeping-between-happy-hour-and-a-night-out/"
              target="_blank"
              className="link underline hover-light-purple"
            >
              disco naps
            </a>
            {' '}
            in 2019 and beyond!
          </p>
        </section>
      </div>
    );
  }
}

export default About;
