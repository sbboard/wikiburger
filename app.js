console.clear();

const puppeteer = require("puppeteer");

const random = "https://en.wikipedia.org/wiki/Special:Random";
const places =
  "https://en.wikipedia.org/wiki/List_of_restaurant_chains_in_the_United_States";

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

async function main() {
  const browser = await puppeteer.launch();
  //get burger name
  const page = await browser.newPage();
  await page.goto(random);
  const title = await page.evaluate(() => {
    let title_obj = {};
    const title = document.querySelector("h1");
    let titleText = title.innerText;
    if (titleText.indexOf("The") == 0) titleText = titleText.replace("The", "");
    if (
      titleText.indexOf("List of") == 0 ||
      titleText.indexOf("List Of") == 0
    ) {
      titleText = titleText.replace("List of", "");
      titleText = titleText.replace("List Of", "");
    }
    if (titleText.indexOf("!") != -1) titleText = titleText.replaceAll("!", "");
    if (titleText.indexOf("?") != -1) titleText = titleText.replaceAll("?", "");
    if (titleText.indexOf(".") != -1) titleText = titleText.replaceAll(".", "");
    if (titleText.indexOf("(") != -1) {
      titleText = titleText.split("(")[0].trim();
    }
    title_obj.name = titleText;
    title_obj.img =
      document.querySelector("#mw-content-text .infobox img") != null
        ? document.querySelector("#mw-content-text .infobox img").src
        : "NOIMG";
    return title_obj;
  });

  //get place
  await page.goto(places);
  const place = await page.evaluate(() => {
    let place_obj = {};
    console.log(document.querySelector("h1"));
    const rows = document
      .querySelector("#Hamburgers")
      .parentElement.nextElementSibling.querySelectorAll("tr");
    const index = Math.floor(Math.random() * (rows.length - 2)) + 1;
    place_obj.name = rows[index].querySelector("td a").innerText.trim();
    place_obj.url = rows[index].querySelector("td a").href;
    return place_obj;
  });

  await page.goto(place.url);
  const place_img = await page.evaluate(() => {
    return document.querySelector("#mw-content-text .infobox img") != null
      ? document.querySelector("#mw-content-text .infobox img").src
      : "NOIMG";
  });

  await browser.close();

  var should =
    Math.random() > 0.9
      ? ["definitely NOT", "horrible"]
      : ["totally", "awesome"];

  var n = "aeiou".indexOf(title.name[0].toLowerCase()) != -1 ? "n" : "";
  console.log(
    `${place.name} should ${should[0]} make a${n} ${toTitleCase(
      title.name
    ).trim()} Burger! That would be ${should[1]}!`
  );
  console.log(place_img);
  console.log(title.img);
}

main();
