import arrayToSentence from 'array-to-sentence';
import { graphql } from 'gatsby';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'tachyons-components';
import config from '../../data/SiteConfig';
import Artist from '../components/Artist/Artist';
import PostTags from '../components/PostTags/PostTags';
import SEO from '../components/SEO/SEO';
import Venue from '../components/Venue/Venue';
import Layout from '../layout';

const linkToLastFM = artist => `${config.lastfm.url}${encodeURI(artist).replace(/%20/g, '+')}`;

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
      opener => `<strong><a href=${linkToLastFM(opener)} target="_blank">${opener}</a></strong>`
    );

    return (
      <div>
        with
        {' '}
        <span dangerouslySetInnerHTML={{ __html: arrayToSentence(styledArray) }} />
      </div>
    );
  }
  return null;
};
const Article = styled('article')`bg-white center mw5 ba b--black-10 mv4`;
const Time = styled('time')`gray db pv2`;
const Headliner = styled('h1')`f6 ttu tracked`;
const CardTitle = styled('div')`pv2 ph3`;
const CardBody = styled('div')`pa3`;
const LastFmLink = styled('a')`link dim lh-title`;

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
          <Article>
            <CardTitle>
              <Headliner>
                {' '}
                <Artist artist={post.artist} />
                {' '}
              </Headliner>
              <Venue venue={post.venue} />
              <OpenerComponent openers={post.openers} />
            </CardTitle>
            <CardBody>
              <LocationComponent city={post.city} state={post.state} country={post.country} />

              <div>{post.price}</div>
              <div>{post.genre}</div>
              <div>{post.solo === 'Yes' ? 'a solo adventure' : 'with a concert buddy'}</div>
              <Time date-time={postNode.fields.date}>{post.date}</Time>
              <div dangerouslySetInnerHTML={{ __html: postNode.html }} />

              <LastFmLink href={linkToLastFM(post.artist)} target="_blank">
                Last.fm listening history
              </LastFmLink>

              <PostTags tags={post.tags} />
            </CardBody>
          </Article>
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
