import './post.css';

import arrayToSentence from 'array-to-sentence';
import { graphql } from 'gatsby';
import React from 'react';
import Helmet from 'react-helmet';

import config from '../../data/SiteConfig';
import Artist from '../components/Artist/Artist';
import Venue from '../components/Venue/Venue';
import PostTags from '../components/PostTags/PostTags';
import SEO from '../components/SEO/SEO';
import SocialLinks from '../components/SocialLinks/SocialLinks';
import UserInfo from '../components/UserInfo/UserInfo';
import Layout from '../layout';

const linkToLastFM = artist =>
  `${config.lastfm.url}${encodeURI(artist).replace(/%20/g, '+')}`;

const LocationComponent = ({ city, state, country }) => {
  return (
    <div>
      <div>
        {city},{' '}{state},{' '}{country}
      </div>
    </div>
  );
};
const OpenerComponent = ({ openers }) => {
  if (openers.length > 0) {
    const styledArray = openers.map(
      opener =>
        `<strong><a href=${linkToLastFM(
          opener
        )} target="_blank">${opener}</a></strong>`
    );

    return (
      <div>
        with
        {' '}
        <span
          dangerouslySetInnerHTML={{ __html: arrayToSentence(styledArray) }}
        />
      </div>
    );
  }
  return null;
};

export default class PostTemplate extends React.Component {
  render() {
    const { slug } = this.props.pageContext;
    const postNode = this.props.data.markdownRemark;
    const post = postNode.frontmatter;
    if (!post.id) {
      post.id = slug;
    }
    return (
      <Layout>
        <div>
          <Helmet>
            <title>{`${post.title} | ${config.siteTitle}`}</title>
          </Helmet>
          <SEO postPath={slug} postNode={postNode} postSEO />

          <div>
            <h1>
              <Artist artist={post.artist} />
              {' '}
at
              {' '}
              <Venue venue={post.venue} />
              {' '}
            on {post.date}
            </h1>

            <OpenerComponent openers={post.openers} />

            <LocationComponent
              city={post.city}
              state={post.state}
              country={post.country}
            />
            <a href={linkToLastFM(post.artist)} target="_blank">
              Last.fm listening history
            </a>

            <div>{post.price}</div>
            <div>{post.genre}</div>

            <div>
              <strong>Was it a solo show?</strong>
              {' '}
              {post.solo}
            </div>

            <div dangerouslySetInnerHTML={{ __html: postNode.html }} />
            <div className="post-meta">
              <PostTags tags={post.tags} />
              <SocialLinks postPath={slug} postNode={postNode} />
            </div>
            <UserInfo config={config} />
          </div>
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      excerpt
      frontmatter {
        title
        cover
        date
        openers
        tags
        artist
        venue
        genre
        price
        solo
        festival
        city
        state
        country
      }
      fields {
        nextTitle
        nextSlug
        prevTitle
        prevSlug
        slug
        date
      }
    }
  }
`;
