const csv = require('csv-parser');
const _ = require('underscore.string');
const fs = require('fs');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const format = require('date-fns/format');

const formatDate = date => format(date, 'MM/DD/YYYY');
const createDirectory = ({ date, artist }) => {
  const path = _.slugify(`${date}-${artist}`);
  const dir = `./posts/${path}`;
  mkdirp.sync(dir);
  return { path, dir };
};

let count = 0;
const parseRow = json => {
  const { path, dir } = createDirectory(json);

  json.title = `${json.artist} at ${json.venue}`;
  json.slug = path;
  json.cover = '';
  json.genre = '';
  json.category = 'show';
  json.tags = [];
  json.created = formatDate(new Date());

  if (!json.price) {
    json.price = 'unknown';
    json.tags.push('unknown price');
  }
  if (json.price === '$0.00') {
    json.price = 'free';
    json.tags.push('free show');
  }
  if (json.solo === 'Yes') json.tags.push('solo show');

  const postFileStr = `---
${yaml.safeDump(json)}---`;

  fs.writeFileSync(`${dir}/index.md`, postFileStr, {
    encoding: 'utf-8'
  });
  count += 1;
  console.table(json);
  console.log(dir);
};

fs.createReadStream('shows.csv')
  .pipe(csv())
  .on('data', parseRow)
  .on('end', () => {
    console.log(`created ${count} entries`);
  });
