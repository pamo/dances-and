import React from "react";
import Helmet from "react-helmet";
import { Link } from "gatsby";
import _ from "lodash";
import Layout from "../../layout";
import SEO from "../../components/SEO/SEO";
import config from "../../../data/SiteConfig";

class Tags extends React.Component {
  render() {
    const { pageContext } = this.props;
    const { tags } = pageContext;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={`All Tags | ${config.siteTitle}`} />
          <SEO />
          {tags.map(tag => (
            <Link
              to={`/tags/${_.kebabCase(tag)}`}
              key={tag}
              className="f3 link hover-light-blue b no-underline black dib mr3 mt1 mb1"
            >
              {tag}
            </Link>
          ))}
        </div>
      </Layout>
    );
  }
}

export default Tags;
