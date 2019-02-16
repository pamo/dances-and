import React from 'react';
import Helmet from 'react-helmet';
import Layout from '../layout';
import Festival from '../components/Festival/Festival';
import SEO from '../components/SEO/SEO';
import config from '../../data/SiteConfig';

class Festivals extends React.Component {
  render() {
    const { festivals } = this.props.pageContext;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={`All Festivals | ${config.siteTitle}`} />
          <SEO />
          {festivals.map(festival => (
            <Festival festival={festival} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Festivals;
