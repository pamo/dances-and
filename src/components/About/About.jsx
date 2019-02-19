import React, { Component } from 'react';
import './About.css';
import styled from 'tachyons-components';

const BodyLink = styled('a')`link underline hover-light-purple`;

class About extends Component {
  render() {
    return (
      <div className="db w100 pa3 center mw5 mw7-ns">
        <h1 className="measure tc">
          Live music gives me
          {' '}
          <a
            href="https://en.wikipedia.org/wiki/Frisson"
            target="_blank"
            rel="noopener noreferrer"
            className="blue link dim"
          >
            frisson
          </a>
          .
        </h1>
        <section className="center measure">
          <p className="lh-copy measure">
            Despite moving to the Bay Area in 2013, I truly didn't start taking
            advantage of the live music scene until 2016 when I met
            {' '}
            <BodyLink
              href="https://thisisimportant.net/2018/12/09/my-2018-year-in-music-data-analysis-and-insights/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sarah
            </BodyLink>
            , found the
            {' '}
            <BodyLink
              href="https://www.facebook.com/groups/concertraptor/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Concert Raptors
            </BodyLink>
            {' '}
            group, and started a job that would allow me to better plan where I
            would be in the world months ahead of time.
          </p>
          <p className="lh-copy measure">
            Through these individuals I've become better connected with the
            music scene and myself by seeking out the pleasure that comes with
            experiencing music live with a concert buddy or two or myself.
          </p>
          <p className="lh-copy measure">
            With every new hobby comes a curiosity to see metrics and data at a
            glance and albeit Last.fm can provide a almost complete picture of
            my listening habits, historical artifacts of the shows I've been
            were spread among ticket stubs, Foursquare check-ins, and vague
            memories of dancing and light shows. Inspired by
            {' '}
            <BodyLink
              href="https://tinnitus.robweychert.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rob Weychert
            </BodyLink>
            , I sought out to create a blog to paint a picture of this data for
            myself and anyone else to see.
          </p>
          <p className="lh-copy measure">
            Here's to more dancing, coffee, and
            {' '}
            <BodyLink
              href="http://www.flask.com/the-art-of-the-disco-nap-sleeping-between-happy-hour-and-a-night-out/"
              target="_blank"
              rel="noopener noreferrer"
            >
              disco naps
            </BodyLink>
            {' '}
            in 2019 and beyond!
          </p>
        </section>
      </div>
    );
  }
}

export default About;
