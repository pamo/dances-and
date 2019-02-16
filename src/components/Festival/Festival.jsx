import React, { Component } from 'react';
import { Link } from 'gatsby';

class Festival extends Component {
  render() {
    const festival = this.props.festival;
    const path = `/festival/${festival}`;
    return (
      <Link to={path} key={festival}>
        <h1>{festival}</h1>
      </Link>
    );
  }
}

export default Festival;
