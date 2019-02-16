const prompt = require('prompt');
const mkdirp = require('mkdirp');
const parse = require('date-fns/parse');
const format = require('date-fns/format');
const getMonth = require('date-fns/get_month');
const getDate = require('date-fns/get_date');
const _ = require('underscore.string');
const yaml = require('js-yaml');
const fs = require('fs');

const formatDate = date => format(date, 'MM/DD/YYYY');
const resultIsTrue = result =>
  result || (result !== 'no' && result.festival !== 'n');

prompt.start();

const values = [
  'date',
  'city',
  'state',
  'country',
  'artist',
  'venue',
  'festival',
  'genre',
  'price',
  'solo'
];

prompt.get(values, (err, result) => {
  const fullDate = formatDate(parse(result.date));
  const path = _.slugify(`${fullDate}-${result.artist}`);
  const dir = `./posts/${path}`;
  mkdirp.sync(dir);
  const tags = [];
  if (resultIsTrue(result.solo)) {
    tags.push('- solo show');
  }

  const frontmatter = {
    title: `${result.artist} at ${result.venue}`,
    genre: `${result.genre}`,
    created: formatDate(new Date()),
    date: `${fullDate}`,
    artist: `${result.artist}`,
    venue: `${result.venue}`,
    price: `${result.price}`,
    solo: `${result.solo}`,
    festival: `${result.festival}`,
    tags: `${tags.join('\n')}`,
    cover: '',
    slug: `"${path}"`
  };

  const postFileStr = `---
${yaml.safeDump(frontmatter)}---`;

  fs.writeFileSync(`${dir}/index.md`, postFileStr, {
    encoding: 'utf-8'
  });

  return console.log(dir);
});
