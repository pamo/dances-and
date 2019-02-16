import React, { Component } from 'react';
import { Link } from 'gatsby';

import { slugify } from 'underscore.string';

class Artist extends Component {
  render() {
    const artist = this.props.artist;
    const path = `/artists/${slugify(artist)}`;
    return (
      <Link to={path} key={artist}>
        <h1>{artist}</h1>
      </Link>
    );
  }
}

export default Artist;
