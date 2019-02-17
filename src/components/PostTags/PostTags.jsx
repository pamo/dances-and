import React, { Component } from 'react';
import _ from 'lodash';
import { Link } from 'gatsby';
import styled from 'tachyons-components';

const Tag = styled(Link)`f6 link dim br-pill ba ph3 pv2 mb2 dib dark-blue`;
const TagContainer = styled('div')`pt3`;

class PostTags extends Component {
  render() {
    const { tags } = this.props;

    return (
      <TagContainer>
        {tags &&
          tags.map(tag => (
            <Tag key={tag} to={`/tags/${_.kebabCase(tag)}`}>
              {tag}
            </Tag>
          ))}
      </TagContainer>
    );
  }
}

export default PostTags;
