import React, { Component } from 'react';
import { Link } from 'gatsby';
import styled from 'tachyons-components';

const NavContainer = styled('header')`w-100 pv3 ml3`;
const NavItems = styled('nav')`f6 fw6 ttu tracked`;

class Nav extends Component {
  render() {
    const pages = ['headliners', 'artists', 'venues', 'festivals', 'about'];

    return (
      <NavContainer>
        <NavItems>
          {pages.map(page => (
            <Link
              to={page === 'headliners' ? '' : page}
              key={page}
              className="link dim blue dib mr3"
            >
              <h4>{page}</h4>
            </Link>
          ))}
        </NavItems>
      </NavContainer>
    );
  }
}
export default Nav;
