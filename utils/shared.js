const mkdirp = require("mkdirp");
const _ = require("underscore.string");
const format = require("date-fns/format");

const formatDate = date => format(date, "MM/DD/YYYY");
const createDirectory = ({ date, artist }) => {
  const path = _.slugify(`${date}-${artist}`);
  const dir = `./posts/${path}`;
  mkdirp.sync(dir);
  return { path, dir };
};

module.exports = { createDirectory, formatDate };
