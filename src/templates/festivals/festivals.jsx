import React from 'react';
import Helmet from 'react-helmet';

import config from '../../../data/SiteConfig';
import Nav from '../../components/Nav/Nav';
import Festival from '../../components/Festival/Festival';
import SEO from '../../components/SEO/SEO';
import Layout from '../../layout';

class Festivals extends React.Component {
  render() {
    const { festivals } = this.props.pageContext;
    return (
      <Layout>
        <Nav />
        <div className="ph3 ph4-m ph5-l tj">
          <Helmet title={`All Festivals | ${config.siteTitle}`} />
          <SEO />
          <h1>
            All
            {' '}
            <span>{festivals.length}</span>
            {' '}
Festivals
          </h1>
          {festivals.map(festival => (
            <Festival festival={festival} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Festivals;
