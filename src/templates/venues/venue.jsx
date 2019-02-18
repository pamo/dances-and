import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../../layout';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';
import Nav from '../../components/Nav/Nav';

export default class VenueTemplate extends React.Component {
  render() {
    const { venue } = this.props.pageContext;
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <Nav />
        <div className="venue-container">
          <Helmet title={`Shows at "${venue}" | ${config.siteTitle}`} />
          <h1 className="ml3">
            I've seen
            {' '}
            {postEdges.length}
            {' '}
shows at
            {' '}
            {venue}
          </h1>

          <PostListing postEdges={postEdges} />
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query VenuePage($venue: String) {
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [fields___date], order: DESC }
      filter: { frontmatter: { venue: { in: [$venue] } } }
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
            tags
            artist
            venue
            festival
            cover
            date
          }
        }
      }
    }
  }
`;
