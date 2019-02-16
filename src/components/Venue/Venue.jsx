import React, { Component } from 'react';
import { Link } from 'gatsby';
import { slugify } from 'underscore.string';

class Venue extends Component {
  render() {
    const venue = this.props.venue;
    const path = `/venues/${slugify(venue)}`;
    return (
      <Link to={path} key={venue}>
        <h1>{venue}</h1>
      </Link>
    );
  }
}

export default Venue;
