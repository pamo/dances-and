import React from 'react';
import Helmet from 'react-helmet';

import config from '../../../data/SiteConfig';
import Artist from '../../components/Artist/Artist';
import SEO from '../../components/SEO/SEO';
import Layout from '../../layout';

class Artists extends React.Component {
  render() {
    const { artists } = this.props.pageContext;
    return (
      <Layout>
        <div className="artist-container">
          <Helmet title={`All Artists | ${config.siteTitle}`} />
          <SEO />
          {artists.map(artist => (
            <Artist artist={artist} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Artists;
