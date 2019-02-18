import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import styled from 'tachyons-components';
import config from '../../../data/SiteConfig';

const HeroFigure = styled('div')`vh-50 dt w-100 tc bg-dark-gray white cover`;
const HeroContainer = styled('div')`dtc v-mid`;
const SiteTitle = styled('h1')`white-80 f1 f-headline-l fw1`;
const SmallHeader = styled('h2')`white-80 f3 fw1 ttu tracked mb2 lh-title`;
const Author = styled('div')`white-90 fw1 f4 ttl fs-normal`;

const Hero = () => (
  <StaticQuery
    query={graphql`
      query HeroImage {
        concert: file(relativePath: { regex: "/unsplash/" }) {
          childImageSharp {
            fluid(
              duotone: { highlight: "#0ec4f1", shadow: "#192550", opacity: 55 }
              toFormat: PNG
            ) {
              src
            }
          }
        }
      }
    `}
    render={data => (
      <HeroFigure
        css={{ background: `url(${data.concert.childImageSharp.fluid.src}) no-repeat center;` }}
      >
        <HeroContainer>
          <SiteTitle>{config.siteTitle}</SiteTitle>
          <SmallHeader>a concert tracker</SmallHeader>
          <Author>by pamela ocampo</Author>
        </HeroContainer>
      </HeroFigure>
    )}
  />
);

export default Hero;
