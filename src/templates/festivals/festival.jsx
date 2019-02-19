import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../../layout';
import Nav from '../../components/Nav/Nav';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';

export default class FestivalTemplate extends React.Component {
  render() {
    const { festival } = this.props.pageContext;
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <Nav />
        <div className="festival-container">
          <Helmet title={`Shows at "${festival}" | ${config.siteTitle}`} />
          <h1 className="ml3">
            I've seen
            {' '}
            {postEdges.length}
            {' '}
artists at
            {' '}
            {festival}
          </h1>

          <PostListing postEdges={postEdges} />
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query FestivalPage($festival: String) {
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [fields___date], order: DESC }
      filter: { frontmatter: { festival: { in: [$festival] } } }
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
