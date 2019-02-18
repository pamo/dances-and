import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../../layout';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';

export default class ArtistTemplate extends React.Component {
  render() {
    const { artist } = this.props.pageContext;
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <div className="artist-container">
          <Helmet title={`Shows with "${artist}" | ${config.siteTitle}`} />
          <PostListing postEdges={postEdges} />
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
            date
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
