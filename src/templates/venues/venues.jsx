import React from 'react';
import Helmet from 'react-helmet';

import SEO from '../../components/SEO/SEO';
import Venue from '../../components/Venue/Venue';
import config from '../../../data/SiteConfig';
import Layout from '../../layout';

class Venues extends React.Component {
  render() {
    const { venues } = this.props.pageContext;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={`All Venues | ${config.siteTitle}`} />
          <SEO />
          {venues.map(venue => (
            <Venue venue={venue} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Venues;
