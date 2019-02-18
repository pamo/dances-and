import { Link } from 'gatsby';
import React, { Component } from 'react';
import { slugify } from 'underscore.string';
import { randomColor } from '../utils';

class Artist extends Component {
  render() {
    const artist = this.props.artist;
    const path = `/artists/${slugify(artist)}`;
    return (
      <Link
        to={path}
        key={artist}
        className={`f3 link hover-${randomColor()} b no-underline black dib mr3 mt1 mb1`}
      >
        <strong>{artist}</strong>
      </Link>
    );
  }
}

export default Artist;
