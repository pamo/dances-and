import React, { Component } from 'react';
import { Link } from 'gatsby';
import { slugify } from 'underscore.string';

import { randomColor } from '../utils';

class Venue extends Component {
  render() {
    const venue = this.props.venue;
    const path = `/venues/${slugify(venue)}`;
    return (
      <Link
        to={path}
        key={venue}
        className={`f3 link hover-${randomColor()} b no-underline black dib mr3 mt1 mb1`}
      >
        <strong>{venue}</strong>
      </Link>
    );
  }
}

export default Venue;
