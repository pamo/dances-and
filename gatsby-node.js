const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const siteConfig = require('./data/SiteConfig');

const postNodes = [];

function addSiblingNodes(createNodeField) {
  postNodes.sort(({ frontmatter: { date: date1 } }, { frontmatter: { date: date2 } }) => {
    const dateA = moment(`${date1}`, siteConfig.dateFromFormat);
    const dateB = moment(`${date2}`, siteConfig.dateFromFormat);

    if (dateA.isBefore(dateB)) return 1;

    if (dateB.isBefore(dateA)) return -1;

    return 0;
  });

  for (let i = 0; i < postNodes.length; i += 1) {
    const nextID = i + 1 < postNodes.length ? i + 1 : 0;
    const prevID = i - 1 >= 0 ? i - 1 : postNodes.length - 1;
    const currNode = postNodes[i];
    const nextNode = postNodes[nextID];
    const prevNode = postNodes[prevID];
    createNodeField({
      node: currNode,
      name: 'nextTitle',
      value: nextNode.frontmatter.artist
    });
    createNodeField({
      node: currNode,
      name: 'nextSlug',
      value: nextNode.fields.slug
    });
    createNodeField({
      node: currNode,
      name: 'prevTitle',
      value: prevNode.frontmatter.artist
    });
    createNodeField({
      node: currNode,
      name: 'prevSlug',
      value: prevNode.fields.slug
    });
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  let slug;
  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent);
    const parsedFilePath = path.parse(fileNode.relativePath);
    if (
      Object.prototype.hasOwnProperty.call(node, 'frontmatter') &&
      Object.prototype.hasOwnProperty.call(node.frontmatter, 'title')
    ) {
      slug = `/${_.kebabCase(node.frontmatter.title)}`;
    } else if (parsedFilePath.name !== 'index' && parsedFilePath.dir !== '') {
      slug = `/${parsedFilePath.dir}/${parsedFilePath.name}/`;
    } else if (parsedFilePath.dir === '') {
      slug = `/${parsedFilePath.name}/`;
    } else {
      slug = `/${parsedFilePath.dir}/`;
    }

    if (Object.prototype.hasOwnProperty.call(node, 'frontmatter')) {
      if (Object.prototype.hasOwnProperty.call(node.frontmatter, 'slug'))
        slug = `/${_.kebabCase(node.frontmatter.slug)}`;
      if (Object.prototype.hasOwnProperty.call(node.frontmatter, 'date')) {
        const date = moment(node.frontmatter.date, siteConfig.dateFromFormat);
        if (!date.isValid) console.warn(`WARNING: Invalid date.`, node.frontmatter);

        createNodeField({
          node,
          name: 'date',
          value: date.toISOString()
        });
      }
    }
    createNodeField({ node, name: 'slug', value: slug });
    postNodes.push(node);
  }
};

exports.setFieldsOnGraphQLNodeType = ({ type, actions }) => {
  const { name } = type;
  const { createNodeField } = actions;
  if (name === 'MarkdownRemark') {
    addSiblingNodes(createNodeField);
  }
};

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const postPage = path.resolve('src/templates/post.jsx');
    const tagPage = path.resolve('src/templates/tags/tag.jsx');
    const venuePage = path.resolve('src/templates/venues/venue.jsx');
    const artistPage = path.resolve('src/templates/artists/artist.jsx');
    const festivalPage = path.resolve('src/templates/festivals/festival.jsx');

    resolve(
      graphql(
        `
          {
            allMarkdownRemark {
              edges {
                node {
                  frontmatter {
                    tags
                    artists
                    festival
                    venue
                  }
                  fields {
                    slug
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          /* eslint no-console: "off" */
          console.log(result.errors);
          reject(result.errors);
        }

        const tagSet = new Set();
        const artistSet = new Set();
        const venueSet = new Set();
        const festivalSet = new Set();

        result.data.allMarkdownRemark.edges.forEach(edge => {
          if (edge.node.frontmatter.tags) {
            edge.node.frontmatter.tags.forEach(tag => {
              tagSet.add(tag);
            });
          }

          if (edge.node.frontmatter.genre) {
            tagSet.add(edge.node.frontmatter.genre);
          }

          if (edge.node.frontmatter.artists) {
            edge.node.frontmatter.artists.forEach(artist => {
              artistSet.add(artist);
            });
          }

          if (edge.node.frontmatter.venue) {
            venueSet.add(edge.node.frontmatter.venue);
          }

          if (edge.node.frontmatter.festival) {
            festivalSet.add(edge.node.frontmatter.festival);
          }

          createPage({
            path: edge.node.fields.slug,
            component: postPage,
            context: {
              slug: edge.node.fields.slug
            }
          });
        });

        createListingPage('tags', 'tag', tagSet, tagPage, createPage);
        createListingPage('artists', 'artist', artistSet, artistPage, createPage);
        createListingPage('venues', 'venue', venueSet, venuePage, createPage);
        createListingPage('festivals', 'festival', festivalSet, festivalPage, createPage);
      })
    );
  });
};

const createListingPage = (dir, itemLabel, set, component, createPage) => {
  const list = Array.from(set).sort();

  const context = {};
  const indexComponent = path.resolve(`src/templates/${dir}/${dir}.jsx`);
  const indexPagePath = `/${dir}`;
  context[dir] = list;

  console.log(`creating ${indexPagePath}`);

  createPage({
    path: indexPagePath,
    context,
    component: indexComponent
  });

  list.forEach(item => {
    const itemPagePath = `/${dir}/${_.kebabCase(item)}`;
    const context = {};
    context[itemLabel] = item;

    console.log(`creating ${itemPagePath}`);
    createPage({
      path: itemPagePath,
      component,
      context
    });
  });
};
