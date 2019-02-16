import React, { Component } from 'react';
import { Link } from 'gatsby';
import { slugify } from 'underscore.string';

class Venue extends Component {
  render() {
    const venue = this.props.venue;
    const path = `/venues/${slugify(venue)}`;
    return (
      <Link to={path} key={venue}>
        <strong>{venue}</strong>
      </Link>
    );
  }
}

export default Venue;
