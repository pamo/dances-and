const prompt = require('prompt');
const mkdirp = require('mkdirp');
const moment = require('moment');
const _ = require('underscore.string');
const yaml = require('js-yaml');
const fs = require('fs');

prompt.start();

prompt.get(
  [
    'date',
    'city',
    'state',
    'country',
    'headliner',
    'venue',
    'festival',
    'genre',
    'price',
    'solo'
  ],
  (err, result) => {
    const fullDate = moment(result.date);
    const year = fullDate.year();
    const month = fullDate.month();
    const date = fullDate.date();
    const dir = `./content/${year}/${month}/${date}/${_.slugify(
      result.headliner
    )}`;
    mkdirp.sync(dir);

    const frontmatter = {
      genre: `${result.genre}`,
      created: moment().toJSON(),
      date: `${fullDate}`,
      headliner: `${result.headliner}`,
      venue: `${result.venue}`,
      price: `${result.price}`,
      solo: `${result.solo}`,
      festival: `${result.festival}`,
      category: 'show'
    };

    const postFileStr = `---
${yaml.safeDump(frontmatter)}---`;

    fs.writeFileSync(`${dir}/index.md`, postFileStr, {
      encoding: 'utf-8'
    });

    return console.log(dir);
  }
);
