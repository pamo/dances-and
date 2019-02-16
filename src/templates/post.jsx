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
import Layout from '../layout';

const linkToLastFM = artist =>
  `${config.lastfm.url}${encodeURI(artist).replace(/%20/g, '+')}`;

const LocationComponent = ({ city, state, country }) => {
  return (
    <div>
      <div>
        {city}
,
        {state}
,
        {country}
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

          <div className="post-container">
            <div className="post-heading">
              <time className="post-date" date-time={postNode.fields.date}>
                {post.date}
              </time>
              <h1 className="headliner">
                <Artist artist={post.artist} />
              </h1>
              <h2 className="venue">
                <Venue venue={post.venue} />
              </h2>

              <OpenerComponent openers={post.openers} />

              <LocationComponent
                city={post.city}
                state={post.state}
                country={post.country}
              />
            </div>
            <div className="post-details">
            <h3>
              <a href={linkToLastFM(post.artist)} target="_blank">
                Last.fm listening history
              </a>
</h3>
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
              </div>
            </div>
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
        date(formatString: "MMMM Do, YYYY")
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
