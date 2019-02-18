import React, { Component } from 'react';
import './About.css';

class About extends Component {
  render() {
    return (
      <div className="about">
        <h1>
          Live music gives me
          {' '}
          <a href="https://en.wikipedia.org/wiki/Frisson" target="_blank" className="blue link dim">
            frisson
          </a>
          .
        </h1>
      </div>
    );
  }
}

export default About;
