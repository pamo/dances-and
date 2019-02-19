import { initial, last } from 'underscore';
import { graphql, Link } from 'gatsby';
import { slugify } from 'underscore.string';
import styled from 'tachyons-components';
import React from 'react';
import Helmet from 'react-helmet';

import config from '../../data/SiteConfig';
import Artist from '../components/Artist/Artist';
import PostTags from '../components/PostTags/PostTags';
import SEO from '../components/SEO/SEO';
import Venue from '../components/Venue/Venue';
import Layout from '../layout';

const LocationComponent = ({ city, state, country }) => {
  return (
    <div className="f5">
      <span>
        {city}
,
      </span>
      {' '}
      <span>
        {state}
,
      </span>
      {' '}
      {country}
    </div>
  );
};

const OpenerComponent = ({ openers }) => {
  if (openers.length > 0) {
    const initialOpeners = initial(openers);
    const lastOpenerName = last(openers);
    const linkPath = name => `artists/${slugify(name)}`;

    return (
      <div>
        with
        {' '}
        {initialOpeners.map(opener => (
          <Link to={linkPath(opener)} key={opener}>
            {opener}
          </Link>
        ))}
        {' '}
        {openers.length > 1 ? 'and' : null}
        {' '}
        {
          <Link to={linkPath(lastOpenerName)} key={lastOpenerName}>
            {lastOpenerName}
          </Link>
        }
      </div>
    );
  }
  return null;
};
const Article = styled('article')`article-full-bleed-background`;
const Time = styled('time')`gray db pv2 f6 ttu avenir`;
const Headliner = styled('h1')`f6 ttu tracked`;
const Card = styled('div')`fl pa3 pa4-ns bg-white black-70 measure-narrow f3`;
const CardTitle = styled('div')`bb b--black-70 pv4 flex items-center justify-between`;
const CardBody = styled('section')`pt4 pb4`;
const Pagination = styled('div')`flex items-center justify-center`;
const PageLink = styled(
  Link
)`f7 avenir no-underline black bg-animate hover-bg-black hover-white inline-flex items-center pa3 ba border-box mr4`;
const CompanyBubble = styled(
  'span'
)`avenir br-100 flex fw6 f3 items-center justify-center bg-washed-blue ba b--light-blue dark-blue h3 w3`;

export default class PostTemplate extends React.Component {
  render() {
    const { slug } = this.props.pageContext;
    const postNode = this.props.data.markdownRemark;
    const year = new Date(postNode.fields.date).getFullYear();
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
            <Card>
              <CardTitle>
                <div>
                  <Headliner>
                    {' '}
                    <Artist artist={post.artist} />
                    {' '}
                  </Headliner>
                  <OpenerComponent openers={post.openers} />
                </div>
                <div className="tc">
                  <CompanyBubble>{post.solo === 'Yes' ? 'solo' : '+1'}</CompanyBubble>
                </div>
              </CardTitle>
              <CardBody>
                <Venue venue={post.venue} />
                <LocationComponent city={post.city} state={post.state} country={post.country} />
                <div>{post.price}</div>
                <div>{post.genre}</div>

                <div dangerouslySetInnerHTML={{ __html: postNode.html }} />
                <Time date-time={postNode.fields.date}>{post.date}</Time>
              </CardBody>
              <PostTags tags={post.tags} />
              <Pagination>
                <PageLink to={postNode.fields.prevSlug}>
                  <svg
                    className="w1"
                    data-icon="chevronLeft"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                  >
                    <title>chevronLeft icon</title>
                    <path d="M20 1 L24 5 L14 16 L24 27 L20 31 L6 16 z" />
                  </svg>
                  {' '}
                  <span className="pl1">{postNode.fields.prevTitle}</span>
                </PageLink>
                <PageLink to={postNode.fields.nextSlug}>
                  <span className="pr1">{postNode.fields.nextTitle}</span>
                  <svg
                    className="w1"
                    data-icon="chevronRight"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                  >
                    <title>chevronRight icon</title>
                    <path d="M12 1 L26 16 L12 31 L8 27 L18 16 L8 5 z" />
                  </svg>
                </PageLink>
              </Pagination>
            </Card>
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
