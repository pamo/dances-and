import React from 'react';
import styled from 'tachyons-components';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import { distanceInWordsToNow } from 'date-fns';
import { take, uniqBy } from 'lodash';
import Layout from '../../layout';
import Nav from '../../components/Nav/Nav';
import PostListing from '../../components/PostListing/PostListing';
import config from '../../../data/SiteConfig';

const linkToLastFM = artist => `${config.lastfm.url}${encodeURI(artist).replace(/%20/g, '+')}`;
const LastFmLink = styled('a')`link dim fw5 flex items-center`;
const LastFMIcon = styled('i')`link hover-mid-gray dib h2 w2 mr2 dark-red`;
const parseLastFmData = ({ edges } = []) => {
  return take(uniqBy(edges[0].node.playbacks, 'track.name'), 30);
};

const ListensTable = styled(
  'table'
)`collapse sans-serif ba br2 b--black-10 pv2 ph3 mt2 w-100 w-two-thirds-ns`;
const ListensCol = styled('td')`pv2 ph2 f6`;
const ListensRow = styled('tr')`ph2 striped--near-white`;

export default class ArtistTemplate extends React.Component {
  render() {
    const { pageContext, data } = this.props;
    const postEdges = data.allMarkdownRemark.edges;
    /* eslint prefer-destructuring: "off" */
    const artist = pageContext.artist;
    const listens = data.allLastfmArtist && parseLastFmData(data.allLastfmArtist);
    const lastFMUser = config.userLinks[2];
    return (
      <Layout>
        <Nav />
        <div className="ml3 mr3">
          <Helmet title={`Shows with "${artist}" | ${config.siteTitle}`} />
          <h1>
            I've seen
            {' '}
            {artist}
            {' '}
            {postEdges.length}
            {' '}
times
          </h1>
          <PostListing postEdges={postEdges} />
          <div className="flex items-center justify-between lh-title avenir f5 fw5 w-100 w-two-thirds-ns">
            <h2>Recent Listens</h2>

            <LastFmLink href={linkToLastFM(artist)} target="_blank">
              <div className="mr1">more on</div>
              <LastFMIcon>
                <svg
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  strokeLinejoin="round"
                  strokeMiterlimit="1.414"
                >
                  <title>{lastFMUser.label}</title>
                  <path d={lastFMUser.svg} fillRule="nonzero" />
                </svg>
              </LastFMIcon>
            </LastFmLink>
          </div>
          {listens ? (
            <ListensTable>
              <tbody>
                <ListensRow>
                  <ListensCol className="tl f6 ttu fw6">Track</ListensCol>
                  <ListensCol className="tl f6 ttu fw6">Album</ListensCol>
                  <ListensCol className="tl f6 ttu fw6">Heard</ListensCol>
                </ListensRow>
                {listens.map((listen, index) => {
                  const date = distanceInWordsToNow(new Date(parseInt(listen.date, 0) * 1000));
                  const key = index + listen.id;
                  return (
                    <ListensRow key={key}>
                      <ListensCol>{listen.track.name}</ListensCol>
                      <ListensCol>{listen.track.album.name}</ListensCol>
                      <ListensCol className="ml3">
                        {date}
                        {' '}
ago
                      </ListensCol>
                    </ListensRow>
                  );
                })}
              </tbody>
            </ListensTable>
          ) : null}
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query ArtistPage($artist: String) {
    allLastfmArtist(filter: { name: { in: [$artist] } }) {
      edges {
        node {
          playbacks {
            id
            date
            track {
              name
              album {
                name
              }
            }
          }
        }
      }
    }
    allMarkdownRemark(
      limit: 1000
      sort: { fields: [fields___date], order: DESC }
      filter: { frontmatter: { artists: { in: [$artist] } } }
    ) {
      totalCount
      edges {
        node {
          fields {
            slug
            date(formatString: "MMMM Do, YYYY")
          }
          excerpt
          timeToRead
          frontmatter {
            title
            artist
            venue
            festival
            tags
            cover
            date
          }
        }
      }
    }
  }
`;
