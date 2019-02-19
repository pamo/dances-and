import React from 'react';
import styled from 'tachyons-components';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../../layout';
import Nav from '../../components/Nav/Nav';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';

const linkToLastFM = artist => `${config.lastfm.url}${encodeURI(artist).replace(/%20/g, '+')}`;
const LastFmLink = styled('a')`link dim lh-title avenir f5 flex items-center fw5`;
const LastFMIcon = styled('a')`link hover-mid-gray dib h2 w2 mr2 dark-red`;

export default class ArtistTemplate extends React.Component {
  render() {
    const { artist } = this.props.pageContext;
    const postEdges = this.props.data.allMarkdownRemark.edges;
    const lastFMUser = config.userLinks[2];
    return (
      <Layout>
        <Nav />
        <div className="ml3 mr3">
          <Helmet title={`Shows with "${artist}" | ${config.siteTitle}`} />
          <h1>
            I've seen
            {' '}
            {artist}
            {' '}
            {postEdges.length}
            {' '}
times
          </h1>
          <PostListing postEdges={postEdges} />
          <LastFmLink href={linkToLastFM(artist)} target="_blank">
            <LastFMIcon>
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fillRule="evenodd"
                clipRule="evenodd"
                strokeLinejoin="round"
                strokeMiterlimit="1.414"
              >
                <title>{lastFMUser.label}</title>
                <path d={lastFMUser.svg} fillRule="nonzero" />
              </svg>
            </LastFMIcon>
            listening history
          </LastFmLink>
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query ArtistPage($artist: String) {
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [fields___date], order: DESC }
      filter: { frontmatter: { artists: { in: [$artist] } } }
    ) {
      totalCount
      edges {
        node {
          fields {
            slug
            date(formatString: "MMMM Do, YYYY")
          }
          excerpt
          timeToRead
          frontmatter {
            title
            artist
            venue
            festival
            tags
            cover
            date
          }
        }
      }
    }
  }
`;
