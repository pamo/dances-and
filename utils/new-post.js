const prompt = require("prompt");
const yaml = require("js-yaml");
const fs = require("fs");
const { createDirectory, formatDate } = require("./shared");

prompt.start();

const values = [
  "date",
  "artist",
  "festival",
  "venue",
  "city",
  "state",
  "country",
  "price",
  "solo",
  "opener1",
  "opener2",
  "opener3",
  "opener4"
];

prompt.get(
  values,
  (
    err,
    {
      date,
      artist,
      festival,
      venue,
      city,
      state,
      country,
      price,
      solo,
      opener1,
      opener2,
      opener3,
      opener4
    }
  ) => {
    const { path, dir } = createDirectory({ date, artist });
    const json = {
      date,
      artist,
      festival,
      venue,
      city,
      state,
      country,
      price,
      solo
    };
    json.title = `${artist} at ${venue}`;
    json.slug = path;
    json.cover = "";
    json.genre = "";
    json.category = "show";
    json.tags = [];
    json.created = formatDate(new Date());

    const openers = [];
    if (opener1) openers.push(opener1);
    if (opener2) openers.push(opener2);
    if (opener3) openers.push(opener3);
    if (opener4) openers.push(opener4);
    json.artists = [artist, ...openers];
    json.openers = openers;

    if (!price) {
      json.price = "unknown";
      json.tags.push("unknown price");
    }
    if (price === 0 || price === "$0.00") {
      json.price = "free";
      json.tags.push("free show");
    }
    if (solo === "y") json.tags.push("solo show");

    const postFileStr = `---
  ${yaml.safeDump(json)}---`;

    fs.writeFileSync(`${dir}/index.md`, postFileStr, {
      encoding: "utf-8"
    });

    return console.log(dir);
  }
);
