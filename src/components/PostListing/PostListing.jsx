import React from 'react';
import { Link } from 'gatsby';
import styled from 'tachyons-components';

const Container = styled('section')`cf w-100 pa2-ns`;
const Post = styled('article')`fl w-100 w-50-m w-25-ns pa2-ns`;
const PostTitleLink = styled('div')`ph2 ph0-ns pb3 link db dim underline-hover`;
const PostMainTitle = styled('h3')`f5 f4-ns mb0 black-90`;
const PostSubTitle = styled('h3')`f6 f5 fw4 mt2 mb0 black-60`;

class PostListing extends React.Component {
  getPostList() {
    const postList = [];
    this.props.postEdges.forEach(postEdge => {
      postList.push({
        path: postEdge.node.fields.slug,
        tags: postEdge.node.frontmatter.tags,
        cover: postEdge.node.frontmatter.cover,
        title: postEdge.node.frontmatter.title,
        artist: postEdge.node.frontmatter.artist,
        venue: postEdge.node.frontmatter.venue,
        festival: postEdge.node.frontmatter.festival,
        date: postEdge.node.fields.date,
        excerpt: postEdge.node.excerpt,
        timeToRead: postEdge.node.timeToRead
      });
    });
    return postList;
  }

  render() {
    const postList = this.getPostList();
    return (
      <Container>
        {postList.map(post => (
          <Post key={post.title}>
            <Link to={post.path} className="no-underline">
              <PostTitleLink>
                <PostMainTitle>{post.artist}</PostMainTitle>
                <PostSubTitle>
                  @
                  {post.festival ? `${post.festival} Music Festival` : post.venue}
                </PostSubTitle>
                <time className="avenir mid-gray ttu tracked f7 fw6">{post.date}</time>
              </PostTitleLink>
            </Link>
          </Post>
        ))}
      </Container>
    );
  }
}

export default PostListing;
