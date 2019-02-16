import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'gatsby';
import { slugify } from 'underscore.string';
import Layout from '../../layout';
import SEO from '../../components/SEO/SEO';
import config from '../../../data/SiteConfig';

class Tags extends React.Component {
  render() {
    const { tags } = this.props.pageContext;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={`All Tags | ${config.siteTitle}`} />
          <SEO />
          {tags.map(tag => (
            <Link to={`/tags/${slugify(tag)}`} key={tag}>
              <h1>{tag}</h1>
            </Link>
          ))}
        </div>
      </Layout>
    );
  }
}

export default Tags;
