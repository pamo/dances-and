import React from 'react';
import Helmet from 'react-helmet';

import config from '../../../data/SiteConfig';
import Artist from '../../components/Artist/Artist';
import SEO from '../../components/SEO/SEO';
import Layout from '../../layout';
import Nav from '../../components/Nav/Nav';

class Artists extends React.Component {
  render() {
    const { artists } = this.props.pageContext;
    return (
      <Layout>
        <Nav />
        <div className="ph3 ph4-m ph5-l">
          <Helmet title={`All Artists | ${config.siteTitle}`} />
          <SEO />
          <h1>
            I've seen
            {' '}
            <span>{artists.length}</span>
            {' '}
artists
          </h1>
          {artists.map(artist => (
            <Artist artist={artist} />
          ))}
        </div>
      </Layout>
    );
  }
}

export default Artists;
