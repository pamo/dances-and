const csv = require("csv-parser");
const fs = require("fs");
const yaml = require("js-yaml");
const { createDirectory, formatDate } = require("./shared");

let count = 0;
const parseRow = data => {
  const { path, dir } = createDirectory(data);
  const {
    date,
    artist,
    festival,
    venue,
    city,
    state,
    country,
    price,
    solo
  } = data;
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

  json.title = `${data.artist} at ${data.venue}`;
  json.slug = path;
  json.cover = "";
  json.genre = "";
  json.category = "show";
  json.tags = [];
  json.created = formatDate(new Date());

  const openers = [];
  if (data.opener1) openers.push(data.opener1);
  if (data.opener2) openers.push(data.opener2);
  if (data.opener3) openers.push(data.opener3);
  if (data.opener4) openers.push(data.opener4);
  json.artists = [data.artist, ...openers];
  json.openers = openers;

  if (!data.price) {
    json.price = "unknown";
    json.tags.push("unknown price");
  }
  if (data.price === "$0.00") {
    json.price = "free";
    json.tags.push("free show");
  }
  if (data.solo === "Yes") json.tags.push("solo show");

  const postFileStr = `---
${yaml.safeDump(json)}---`;

  fs.writeFileSync(`${dir}/index.md`, postFileStr, {
    encoding: "utf-8"
  });

  count += 1;
  console.table(json);
  console.log(dir);
};

fs.createReadStream("shows.csv")
  .pipe(csv())
  .on("data", parseRow)
  .on("end", () => {
    console.log(`created ${count} entries`);
  });
