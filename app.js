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
    const title = document.querySelector("h1");
    const titleText = title.innerText.toLowerCase();
    if (titleText.indexOf("the") == 0) titleText = titleText.replace("the", "");
    if (titleText.indexOf("list of") == 0)
      titleText = titleText.replace("list of", "");
    if (titleText.indexOf("!") != -1) titleText = titleText.replaceAll("!", "");
    if (titleText.indexOf("?") != -1) titleText = titleText.replaceAll("?", "");
    if (titleText.indexOf(".") != -1) titleText = titleText.replaceAll(".", "");
    return titleText;
  });

  //get place name
  const page_two = await browser.newPage();
  await page_two.goto(places);
  const place = await page_two.evaluate(() => {
    console.log(document.querySelector("h1"));
    const rows = document
      .querySelector("#Hamburgers")
      .parentElement.nextElementSibling.querySelectorAll("tr");
    const index = Math.floor(Math.random() * (rows.length - 2)) + 1;
    const placeName = rows[index].querySelector("td a").innerText.trim();
    return placeName;
  });

  var should =
    Math.random() > 0.9
      ? ["definitely not", "horrible"]
      : ["totally", "awesome"];

  await browser.close();
  console.log(
    place,
    "should",
    should[0],
    "make a",
    toTitleCase(title),
    "Burger! That would be",
    should[1] + "!"
  );
}

main();
