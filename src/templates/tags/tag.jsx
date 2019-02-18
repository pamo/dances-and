import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../../layout';
import Nav from '../../components/Nav/Nav';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';

export default class TagTemplate extends React.Component {
  render() {
    const { tag } = this.props.pageContext;
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <Nav />
        <div className="tag-container">
          <h1 className="ml3">
            {postEdges.length}
            {' '}
            <span>{tag}</span>
            {' '}
shows
          </h1>
          <Helmet title={`Posts tagged as "${tag}" | ${config.siteTitle}`} />
          <PostListing postEdges={postEdges} />
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query TagPage($tag: String) {
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [fields___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
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
