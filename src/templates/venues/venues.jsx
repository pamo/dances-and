import React from 'react';
import Helmet from 'react-helmet';

import config from '../../../data/SiteConfig';
import Nav from '../../components/Nav/Nav';
import SEO from '../../components/SEO/SEO';
import Venue from '../../components/Venue/Venue';
import Layout from '../../layout';

class Venues extends React.Component {
  render() {
    const { venues } = this.props.pageContext;
    return (
      <Layout>
        <Nav />
        <div className="ph3 ph4-m ph5-l tj">
          <Helmet title={`All Venues | ${config.siteTitle}`} />
          <SEO />
          <h1>
            All
            {' '}
            <span>{venues.length}</span>
            {' '}
Venues
          </h1>
          {venues.map(venue => (
            <Venue venue={venue} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Venues;
