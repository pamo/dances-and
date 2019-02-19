import { Link } from "gatsby";
import React, { Component } from "react";
import _ from "lodash";
import { randomColor } from "../utils";

class Artist extends Component {
  render() {
    const { artist } = this.props;
    const path = `/artists/${_.kebabCase(artist)}`;
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
