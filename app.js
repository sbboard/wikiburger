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
    var info = {};
    if (
      document.querySelector("#mw-content-text .thumbinner img") == null &&
      document.querySelector(".infobox-image img") == null
    ) {
      info.has_image = false;
    } else {
      info.has_image = true;
    }
    const title = document.querySelector("h1");
    info.title = title.innerText;
    return info;
  });

  if (has_image.has_image) {
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
        document.querySelector(".infobox-image img") != null
          ? document.querySelector(".infobox-image img").src
          : document.querySelector("#mw-content-text .thumbinner img") != null
          ? document.querySelector("#mw-content-text .thumbinner img").src
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
    }

    await browser.close();

    //image output pt1
    await images(600, 400)
      .fill(0xff, 0xff, 0xff, 1)
      .draw(images("burger.png").resize(600, 400), 0, 0)
      .draw(images("place.png").resize(300, 100), 5, 5)
      .draw(images("img/burg.png").resize(200, 200), 400, 200)
      .save("output.jpg", { quality: 20 });

    //deciding
    const key = Math.floor(Math.random() * 100) + 1;
    var n = "aeiou".indexOf(title.name[0].toLowerCase()) != -1 ? "n" : "";

    if (1 == 2) {
      //placeholder
    } else if (key == 1) {
      //definitely not
      console.log(
        `${place.name} should DEFINITELY NOT make a${n} ${toTitleCase(
          title.name
        ).trim()} Burger! That would be AWFUL!`
      );
      await images("output.jpg")
        .draw(images("img/no.png").resize(600, 400), 0, 0)
        .draw(images("place.png").resize(300, 100), 5, 5)
        .save("output.jpg", { quality: 100 });
    } else if (key == 2) {
      //tucker carlson breaking announcement
      console.log(
        `BREAKING NEWS: ${place.name} has announced a${n} ${toTitleCase(
          title.name
        ).trim()} Burger! Really? Last time I checked ${
          title.name
        } wasn't a type of burger. Guess we can thank Joe Biden for that one.`
      );
      await images(600, 400)
        .draw(images("img/tucker.png").resize(200, 350), 0, 0)
        .draw(images("img/news.png").resize(600, 50), 0, 350)
        .draw(images("output.jpg").resize(400, 350), 200, 0)
        .save("output.jpg", { quality: 10 });
    } else if (key == 3) {
      //date
      console.log(
        `"Wow, this ${toTitleCase(
          title.name
        ).trim()} Burger is amazing. Thank you so much for taking me to ${
          place.name
        } for our anniversary. I never knew I could be this happy..."`
      );
      await images(600, 400)
        .draw(images("img/date.png").resize(600, 400), 0, 0)
        .draw(images("place.png").resize(150, 100), 10, 10)
        .draw(images("img/burg.png").resize(200, 200), 200, 200)
        .draw(images("burger.png").resize(200, 50), 200, 300)
        .save("output.jpg", { quality: 20 });
    } else if (key == 4) {
      //date
      console.log(
        `"This is a stick-up! No one's leaving this ${toTitleCase(
          place.name
        ).trim()} until I get my hands on a${n} ${toTitleCase(
          title.name
        )} Burger! Now I ain't playin' games! Don't be a wise guy and get grillin before I get WILD!"`
      );
      await images(600, 400)
        .draw(images("img/chef.jpg").resize(200, 400), 0, 0)
        .draw(images("img/gunman.png").resize(400, 400), 200, 0)
        .draw(images("place.png").resize(30, 30), 90, 55)
        .draw(images("img/burg.png").resize(40, 40), 90, 200)
        .draw(images("burger.png").resize(200, 100), 390, 290)
        .save("output.jpg", { quality: 20 });
    } else if (key == 5) {
      //date
      console.log(
        `"So Cloud ❤️, what do you think of the ${toTitleCase(
          title.name
        )} Burger I made you? I know it's not as good as the ones they make at ${toTitleCase(
          place.name
        ).trim()} but we don't have any of those here at Sector 7."`
      );
      await images(600, 400)
        .draw(images("img/tifa.jpg").resize(600, 400), 0, 0)
        .draw(images("burger.png").resize(70, 100), 40, 145)
        .draw(images("img/burg.png").resize(100, 100), 235, 255)
        .save("output.jpg", { quality: 20 });
    } else if (key == 6) {
      //gordon ramsney
      console.log(
        `${place.name} should total make a${n} ${toTitleCase(
          title.name
        ).trim()} Burger! Even the prince of food - Gordon Ramsay himself would love it!`
      );
      await images("output.jpg")
        .draw(images("img/gordon.png").resize(200, 400), 0, 0)
        .save("output.jpg", { quality: 100 });
    } else if (key == 7) {
      //fat cat
      console.log(
        `OH NO! OH NO! MY CAT ATE THE FAMOUS ${place.name.toUpperCase()} ${title.name
          .trim()
          .toUpperCase()} BURGER! IT MADE HIM MASSIVE! IT MADE HIM HUGE! MY WIFE IS GOING TO KILL ME! SCREW YOU ${place.name.toUpperCase()}!!!`
      );
      await images(600, 400)
        .draw(images("img/big_cat.jpg").resize(600, 400), 0, 0)
        .draw(images("burger.png").resize(200, 200), 150, 100)
        .draw(images("img/burg.png").resize(200, 200), 400, 200)
        .draw(images("img/crazy_man.png").resize(350, 250), 0, 150)
        .save("output.jpg", { quality: 20 });
    } else {
      //default
      console.log(
        `${place.name} should total make a${n} ${toTitleCase(
          title.name
        ).trim()} Burger! That would be so cool!`
      );
    }
  } else {
    console.log(has_image.title, "- no image. restarting.");
    await browser.close();
    main();
  }
}

main();
