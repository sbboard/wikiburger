console.clear();

const puppeteer = require("puppeteer");
const images = require("images");
const fs = require("fs");

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
  const has_image = await page.evaluate(() => {
    if (document.querySelector("#mw-content-text .infobox img") == null) {
      return false;
    } else {
      return true;
    }
  });

  if (has_image) {
    const title = await page.evaluate(() => {
      let title_obj = {};
      const title = document.querySelector("h1");
      let titleText = title.innerText;
      if (titleText.indexOf("The") == 0)
        titleText = titleText.replace("The", "");
      if (
        titleText.indexOf("List of") == 0 ||
        titleText.indexOf("List Of") == 0
      ) {
        titleText = titleText.replace("List of", "");
        titleText = titleText.replace("List Of", "");
      }
      if (titleText.indexOf("!") != -1)
        titleText = titleText.replaceAll("!", "");
      if (titleText.indexOf("?") != -1)
        titleText = titleText.replaceAll("?", "");
      if (titleText.indexOf(".") != -1)
        titleText = titleText.replaceAll(".", "");
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

    //get images
    var viewSource = await page.goto(place_img);
    fs.writeFile("place.png", await viewSource.buffer(), function (err) {
      if (err) {
        return console.log(err);
      }
    });
    if (title.img != "NOIMG") {
      var titleSource = await page.goto(title.img);
      fs.writeFile("burger.png", await titleSource.buffer(), function (err) {
        if (err) {
          return console.log(err);
        }
      });
    } else {
      console.log("no image");
    }

    await browser.close();

    if (title.img != "NOIMG") {
      await images("burger.png")
        .resize(600, 400)
        .draw(images("place.png").resize(300, 100), 5, 5)
        .draw(images("burg.png").resize(200, 200), 400, 200)
        .save("output.jpg", { quality: 20 });
    }

    var should =
      Math.random() > 0.9
        ? ["definitely NOT", "horrible"]
        : ["totally", "awesome"];

    if (should[0] == "definitely NOT") {
      await images("output.jpg")
        .draw(images("no.png").resize(600, 400), 0, 0)
        .draw(images("place.png").resize(300, 100), 5, 5)
        .save("output.jpg", { quality: 100 });
    }
    var n = "aeiou".indexOf(title.name[0].toLowerCase()) != -1 ? "n" : "";
    console.log(
      `${place.name} should ${should[0]} make a${n} ${toTitleCase(
        title.name
      ).trim()} Burger! That would be ${should[1]}!`
    );
  } else {
    console.log("no image. restarting.")
    await browser.close();
    main();
  }
}

main();
