import React from 'react';
import Helmet from 'react-helmet';
import Layout from '../layout';
import Venue from '../components/Venue/Venue';
import SEO from '../components/SEO/SEO';
import config from '../../data/SiteConfig';

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
