import React, { Component } from 'react';
import { Link } from 'gatsby';
import { randomColor } from '../utils';

class Festival extends Component {
  render() {
    const festival = this.props.festival;
    const path = `/festival/${festival}`;
    return (
      <Link
        to={path}
        key={festival}
        className={`f3 link hover-${randomColor()} b no-underline black dib mr3 mt1 mb1`}
      >
        {festival}
      </Link>
    );
  }
}

export default Festival;
