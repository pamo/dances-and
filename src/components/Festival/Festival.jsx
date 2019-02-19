import React, { Component } from "react";
import _ from "lodash";
import { Link } from "gatsby";
import { randomColor } from "../utils";

class Festival extends Component {
  render() {
    const { festival } = this.props;
    const path = `/festivals/${_.kebabCase(festival)}`;
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
