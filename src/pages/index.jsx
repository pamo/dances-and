import isAfter from "date-fns/is_after";
import parse from "date-fns/parse";
import { graphql } from "gatsby";
import { partition } from "lodash";
import React from "react";
import Helmet from "react-helmet";

import config from "../../data/SiteConfig";
import Footer from "../components/Footer/Footer";
import Hero from "../components/Hero/Hero";
import Nav from "../components/Nav/Nav";
import PostListing from "../components/PostListing/PostListing";
import SEO from "../components/SEO/SEO";
import Layout from "../layout";

class Index extends React.Component {
  render() {
    const { data } = this.props;
    const markdown = data.allMarkdownRemark;
    const { edges: postEdges } = markdown;
    const [future, past] = partition(postEdges, edge => {
      const date = parse(edge.node.fields.isoDate);
      const isAfterToday = isAfter(date, new Date());

      return isAfterToday;
    });

    return (
      <Layout>
        <div className="index-container">
          <Helmet title={config.siteTitle} />
          <SEO />
          <Hero />
          <Nav />
          <h1 className="pl3 pr3">{future.length} Upcoming Shows</h1>
          <PostListing postEdges={future} />
          <h1 className="pl3 pr3">{past.length} Past Shows</h1>
          <PostListing postEdges={past} />
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
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          fields {
            slug
            isoDate: date
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
