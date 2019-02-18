import React, { Component } from 'react';
import styled from 'tachyons-components';
import './UserLinks.css';

const Links = styled('div')`tc lh-copy mt3`;
const Social = styled('a')`link near-black hover-light-purple dib h2 w2 mr3`;

class UserLinks extends Component {
  getLinkElements() {
    const { userLinks } = this.props.config;
    const { labeled } = this.props;
    return userLinks.map(link => (
      <Social key={link.label} href={link.url} target="_blank">
        <svg
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fillRule="evenodd"
          clipRule="evenodd"
          strokeLinejoin="round"
          strokeMiterlimit="1.414"
        >
          <title>{link.label}</title>
          <path d={link.svg} fillRule="nonzero" />
        </svg>
      </Social>
    ));
  }

  render() {
    const { userLinks } = this.props.config;
    if (!userLinks) {
      return null;
    }
    return <Links>{this.getLinkElements()}</Links>;
  }
}

export default UserLinks;
