import React, { Component } from 'react';
import _ from 'lodash';
import { Link } from 'gatsby';
import styled from 'tachyons-components';

const Tag = styled('span')`f6 link dim br-pill ba ph3 pv2 mb2 dib dark-blue`;
const TagContainer = styled('div')`pt3`;

class PostTags extends Component {
  render() {
    const { tags } = this.props;

    return (
      <TagContainer>
        {tags &&
          tags.map(tag => (
            <Link key={tag} style={{ textDecoration: 'none' }} to={`/tags/${_.kebabCase(tag)}`}>
              <Tag>{tag}</Tag>
            </Link>
          ))}
      </TagContainer>
    );
  }
}

export default PostTags;
