import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Footer from '../components/Footer/Footer';
import Layout from '../layout';
import PostListing from '../components/PostListing/PostListing';
import SEO from '../components/SEO/SEO';
import Hero from '../components/Hero/Hero';
import Nav from '../components/Nav/Nav';
import config from '../../data/SiteConfig';

class Index extends React.Component {
  render() {
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={config.siteTitle} />
          <SEO />
          <Hero />
          <Nav />
          <PostListing postEdges={postEdges} />
        </div>
        <Footer config={config} />
      </Layout>
    );
  }
}

export default Index;

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(limit: 2000, sort: { fields: [fields___date], order: DESC }) {
      edges {
        node {
          fields {
            slug
            date(formatString: "MMM Do, YYYY")
          }
          excerpt
          timeToRead
          frontmatter {
            title
            tags
            cover
            date
            venue
            artist
            festival
          }
        }
      }
    }
  }
`;
