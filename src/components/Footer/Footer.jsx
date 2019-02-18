import React, { Component } from 'react';
import { Link } from 'gatsby';
import styled from 'tachyons-components';
import { jsx } from '@emotion/core';

import UserLinks from '../UserLinks/UserLinks';
import './Footer.css';

const FooterContainer = styled('footer')`pv4 ph3 ph5-m ph6-l mid-gray footer`;
const UnsplashCredit = styled('small')`fw1 tc`;
const Copy = styled('small')`f6 db tc`;
const Links = styled('div')`tc`;
const RSSLink = styled(Link)`f6 dib ph2 link mid-gray dim`;
const FooterLink = styled('a')`f6 dib ph2 link mid-gray dim`;

class Footer extends Component {
  render() {
    const { config } = this.props;
    const { copyright } = config;
    const url = config.siteRss;
    if (!copyright) {
      return null;
    }
    return (
      <FooterContainer css={{ clear: 'both' }}>
        <Copy>{copyright}</Copy>
        <Links>
          <RSSLink to={url}>Subscribe</RSSLink>
          {' '}
|
          {' '}
          <UnsplashCredit>
            <FooterLink href="https://unsplash.com/photos/NYrVisodQ2M" target="_blank">
              📷: @yvettedewit
            </FooterLink>
          </UnsplashCredit>
        </Links>
        <UserLinks config={config}></UserLinks>
      </FooterContainer>
    );
  }
}

export default Footer;
