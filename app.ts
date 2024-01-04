const { BskyAgent } = require("@atproto/api");
var fs = require("fs"),
  path = require("path"),
  config = require(path.join(__dirname, "config.js"));
const puppeteer = require("puppeteer");
const images = require("images");

let admin = {
  debug: true,
  view_test: true, //if true, will not post to bsky
  link: "https://en.wikipedia.org/wiki/Ashurbeyov_House" as string | null, //force a specific article
  restaraunt: null as string | null, //force a specific restaraunt
  key: null as number | null, //decides which view to use
};

const w = "https://en.wikipedia.org/wiki";
const random = admin.debug && admin.link ? admin.link : `${w}/Special:Random`;
const places = `${w}/List_of_restaurant_chains_in_the_United_States`;

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

async function imageToInt8Array(imagePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err: any, data: Iterable<number>) => {
      if (err) {
        reject(err);
        return;
      }
      const int8Array = new Int8Array(data);
      resolve(int8Array);
    });
  });
}

async function postBsky(msg: string) {
  try {
    const agent = new BskyAgent({ service: "https://bsky.social" });
    await agent.login(config);

    const imagePath = path.join(__dirname, "output.jpg");
    const int8Array = await imageToInt8Array(imagePath);
    const testUpload = await agent.uploadBlob(int8Array, {
      encoding: "image/png",
    });
    await agent.post({
      text: msg,
      embed: {
        images: [
          {
            image: testUpload.data.blob,
            alt: msg,
          },
        ],
        $type: "app.bsky.embed.images",
      },
    });
    console.log(`Posted ${imagePath} to Bluesky`);
    return true;
  } catch (e) {
    console.log("ERROR IN BSKY POSTING");
    console.log(e);
    return false;
  }
}

async function fetchWikipedia(): Promise<{ place: Place; title: Title }> {
  console.log("......new session....");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(random);
  const has_image = await page.evaluate(() => {
    const info = {
      has_image: false,
      title: "",
      url: "",
    };
    info.has_image =
      !!document.querySelector("#mw-content-text .thumbinner img") ||
      !!document.querySelector(".infobox-image img");
    const title = document.querySelector("h1");
    if (!title) return info;
    info.title = title.innerText;
    info.url = location.href;
    return info;
  });

  console.log(has_image.url);

  if (has_image.has_image) {
    const title = await page.evaluate(() => {
      let title_obj = {
        name: "",
        img: "",
      };
      const title = document.querySelector("h1");
      if (!title) return title_obj;
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
      title_obj.name = titleText;
      const BI = document.querySelector(
        ".infobox-image img"
      ) as HTMLImageElement;
      const TIquery = "#mw-content-text .thumbinner img";
      const TI = document.querySelector(TIquery) as HTMLImageElement;
      title_obj.img = BI ? BI.src : TI ? TI.src : "NOIMG";
      return title_obj;
    });

    //get place
    await page.goto(places);
    const place = await page.evaluate(() => {
      if (!document) return;
      let place_obj = {
        name: "",
        url: "",
      };
      const rows = document
        .querySelector("#Hamburgers")
        .parentElement.nextElementSibling.querySelectorAll("tr");
      const index = Math.floor(Math.random() * (rows.length - 2)) + 1;
      const aEl = rows[index].querySelector("td a") as HTMLAnchorElement;
      place_obj.name = aEl.innerText.trim();
      place_obj.url = aEl.href;
      return place_obj;
    });

    if (admin.debug && admin.restaraunt != null) {
      place.url = admin.restaraunt;
    }

    console.log(place.url);

    await page.goto(place.url);
    const place_img = await page.evaluate(() => {
      const BI = document.querySelector(
        ".infobox-image img"
      ) as HTMLImageElement;
      const TIquery = "#mw-content-text .thumbinner img";
      const TI = document.querySelector(TIquery) as HTMLImageElement;
      return BI ? BI.src : TI ? TI.src : "NOIMG";
    });

    //get images
    if (place_img != "NOIMG") {
      var viewSource = await page.goto(place_img);
      fs.writeFile("place.png", await viewSource.buffer(), function (err: any) {
        if (err) {
          return console.log(err);
        }
      });
    }

    var titleSource = await page.goto(title.img);
    fs.writeFile("burger.png", await titleSource.buffer(), function (err: any) {
      if (err) {
        return console.log(err);
      }
    });

    await browser.close();
    return { place, title };
  }
  console.log(has_image.title, "- no image. oh well.");
  await browser.close();
  return { place: null, title: null };
}

async function runScript() {
  var time = new Date();
  var h = time.getHours();
  var m = time.getMinutes();
  if ((h % 2 == 0 && m == 0) || admin.debug == true) {
    try {
      const { place, title } = await fetchWikipedia();
      if (!place || !title) return;
      console.log("finished fetching");
      //image output pt1
      await images(600, 400)
        .fill(0xff, 0xff, 0xff, 1)
        .draw(images("burger.png").resize(600, 400), 0, 0)
        .draw(images("place.png").resize(200, 75), 5, 5)
        .draw(images("img/burg.png").resize(200, 200), 400, 200)
        .save("output.jpg", { quality: 20 });
      console.log("finished drawing");
      const msg = await generateView(place, title);

      console.log("message:", msg);
      if (!admin.view_test && admin.debug) {
        await postBsky(msg);
      }
    } catch (error) {
      console.log("ERROR:", error);
    }
  }
}

function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

interface Title {
  name: string;
  img: string;
}

interface Place {
  name: string;
  url: string;
}

async function generateView(place: Place, title: Title) {
  let msg = "";
  const key = admin.debug && admin.key ? admin.key : getRandomNumber();
  const n = "aeiou".indexOf(title.name[0].toLowerCase()) != -1 ? "n" : ""; //turn a to an for grammatic reasons
  if (key == 1) {
    //definitely not
    msg = `${place.name} should DEFINITELY NOT make a${n} ${toTitleCase(
      title.name
    ).trim()} Burger! That would be AWFUL!`;
    await images("output.jpg")
      .draw(images("img/no.png").resize(600, 400), 0, 0)
      .save("output.jpg", { quality: 100 });
  } else if (key == 2) {
    //tucker carlson breaking announcement
    msg = `BREAKING NEWS: ${place.name} has announced a${n} ${toTitleCase(
      title.name
    ).trim()} Burger! Really? Last time I checked ${
      title.name
    } wasn't a type of burger. Guess we can thank President Brandon for that one.`;
    await images(600, 400)
      .draw(images("img/tucker.png").resize(200, 350), 0, 0)
      .draw(images("img/news.png").resize(600, 50), 0, 350)
      .draw(images("output.jpg").resize(400, 350), 200, 0)
      .save("output.jpg", { quality: 10 });
  } else if (key == 3) {
    //date
    msg = `"Wow, this ${toTitleCase(
      title.name
    ).trim()} Burger is amazing. Thank you so much for taking me to ${
      place.name
    } for our anniversary. I never knew I could be this happy..."`;
    await images(600, 400)
      .draw(images("img/date.png").resize(600, 400), 0, 0)
      .draw(images("place.png").resize(150, 100), 10, 10)
      .draw(images("img/burg.png").resize(200, 200), 200, 200)
      .draw(images("burger.png").resize(200, 50), 200, 300)
      .save("output.jpg", { quality: 20 });
  } else if (key == 4) {
    //date
    msg = `"This is a stick-up! No one's leaving this ${toTitleCase(
      place.name
    ).trim()} until I get my hands on a${n} ${toTitleCase(
      title.name
    )} Burger! Now I ain't playin' games! Don't be a wise guy and get grillin before I get WILD!"`;
    await images(600, 400)
      .draw(images("img/chef.jpg").resize(200, 400), 0, 0)
      .draw(images("img/gunman.png").resize(400, 400), 200, 0)
      .draw(images("place.png").resize(30, 30), 90, 55)
      .draw(images("img/burg.png").resize(40, 40), 90, 200)
      .draw(images("burger.png").resize(200, 100), 390, 290)
      .save("output.jpg", { quality: 20 });
  } else if (key == 5) {
    //date
    msg = `"So Cloud ❤️, what do you think of the ${toTitleCase(
      title.name
    )} Burger I made you? I know it's not as good as the ones they make at ${toTitleCase(
      place.name
    ).trim()} but we don't have any of those here at Sector 7."`;
    await images(600, 400)
      .draw(images("img/tifa.jpg").resize(600, 400), 0, 0)
      .draw(images("burger.png").resize(70, 100), 40, 145)
      .draw(images("img/burg.png").resize(100, 100), 235, 255)
      .save("output.jpg", { quality: 20 });
  } else if (key == 6) {
    //gordon ramsney
    msg = `${place.name} should total make a${n} ${toTitleCase(
      title.name
    ).trim()} Burger! Even the prince of food - Gordon Ramsay himself would love it!`;
    await images("output.jpg")
      .draw(images("img/gordon.png").resize(200, 400), 0, 0)
      .save("output.jpg", { quality: 100 });
  } else if (key == 7) {
    //fat cat
    msg = `OH NO! OH NO! MY CAT ATE THE FAMOUS ${place.name.toUpperCase()} ${title.name
      .trim()
      .toUpperCase()} BURGER! IT MADE HIM MASSIVE! IT MADE HIM HUGE! MY WIFE IS GOING TO KILL ME! SCREW YOU ${place.name.toUpperCase()}!!!`;
    await images(600, 400)
      .draw(images("img/big_cat.jpg").resize(600, 400), 0, 0)
      .draw(images("burger.png").resize(200, 200), 150, 100)
      .draw(images("img/burg.png").resize(200, 200), 400, 200)
      .draw(images("img/crazy_man.png").resize(350, 250), 0, 150)
      .save("output.jpg", { quality: 20 });
  } else if (key == 8) {
    //bad meme
    msg = `Last night I ${title.name.trim().toLowerCase()} burger your sister`;

    await images(600, 600)
      .draw(images("img/meme.jpg").resize(600, 600), 0, 0)
      .draw(images("img/white.png").resize(275, 330), 3, 140)
      .draw(images("burger.png").resize(275, 330), 3, 140)
      .save("output.jpg", { quality: 10 });
  } else if (key == 9) {
    //tarzan
    msg = `Ooo ooo ah ah! Clayton stole the ${
      place.name
    } ${title.name.trim()} Burger from the monkeys! Ooo ooo ah ah!`;

    await images(600, 400)
      .draw(images("img/monkeys.jpg").resize(700, 400), 0, 0)
      .draw(images("img/clayton.png").resize(250, 400), 0, 50)
      .draw(images("burger.png").resize(100, 100), 225, 40)
      .draw(images("img/burg.png").resize(100, 100), 225, 140)
      .draw(images("place.png").resize(200, 100), 400, 300)
      .save("output.jpg", { quality: 20 });
  } else if (key == 10) {
    //coupon
    msg = `GREAT DEAL: FREE ${title.name.trim()} Burger at ${
      place.name
    } with the use of coupon. #ad`;

    await images(600, 400)
      .draw(images("img/coupon.jpg").resize(600, 400), 0, 0)
      .draw(images("img/burger_text.png").resize(270, 30), 240, 20)
      .draw(images("img/white.png").resize(590, 200), 0, 100)
      .draw(images("burger.png").resize(230, 230), 285, 60)
      .draw(images("img/burg.png").resize(200, 200), 130, 90)
      .draw(images("img/burg.png").resize(200, 200), 20, 100)
      .draw(images("img/white.png").resize(90, 100), 500, 290)
      .draw(images("place.png").resize(90, 100), 500, 295)
      .save("output.jpg", { quality: 20 });
  } else {
    //default
    msg = `${place.name} should total make a${n} ${toTitleCase(
      title.name
    ).trim()} Burger! That would be so cool!`;
  }
  return msg;
}

const intervalTime = admin.debug ? 10000 : 60000;
setInterval(() => {
  runScript();
}, intervalTime);
const modeMessage = admin.debug ? "admin mode on" : "normal mode on";
console.log(modeMessage);
