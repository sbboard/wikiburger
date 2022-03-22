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
      ? ["definitely NOT", "horrible"]
      : ["totally", "awesome"];

  var n = "aeiou".indexOf(title[0].toLowerCase()) != -1 ? "n" : "";

  await browser.close();
  console.log(
    `${place} should ${should[0]} make a${n} ${toTitleCase(
      title
    ).trim()} Burger! That would be ${should[1]}!`
  );
}

main();
