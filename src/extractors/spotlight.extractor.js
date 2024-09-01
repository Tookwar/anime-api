import axios from "axios";
import * as cheerio from "cheerio";
import formatTitle from "../helper/formatTitle.helper.js";
import baseUrl from "../utils/baseUrl.js";

async function extractSpotlights() {
  try {
    const resp = await axios.get(`${baseUrl}/home`);
    const $ = cheerio.load(resp.data);

    const slideElements = $(
      "div.deslide-wrap > div.container > div#slider > div.swiper-wrapper > div.swiper-slide"
    );

    const promises = slideElements
      .map(async (ind, ele) => {
        const poster = $(ele)
          .find(
            "div.deslide-item > div.deslide-cover > div.deslide-cover-img > img.film-poster-img"
          )
          .attr("data-src");
        const title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .text()
          .trim();
        const japanese_title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .attr("data-jname")
          .trim();
        const description = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-description"
          )
          .text()
          .trim();
        const data_id = $(ele)
          .find(
            ".deslide-item > .deslide-item-content > .desi-buttons > a:eq(0)"
          )
          .attr("href")
          .split("/")
          .pop()
          .split("-")
          .pop();
        const tvInfoMapping = {
          0: "showType",
          1: "duration",
          2: "releaseDate",
          3: "quality",
          4: "episodeInfo",
        };

        const tvInfo = {};

        await Promise.all(
          $(ele)
            .find("div.sc-detail > div.scd-item")
            .map(async (index, element) => {
              const key = tvInfoMapping[index];
              let value = $(element).text().trim().replace(/\n/g, "");

              const tickContainer = $(element).find(".tick");

              if (tickContainer.length > 0) {
                value = {
                  sub: tickContainer.find(".tick-sub").text().trim(),
                  dub: tickContainer.find(".tick-dub").text().trim(),
                };
              }
              tvInfo[key] = value;
            })
        );
        const id = formatTitle(title, data_id);
        return {
          id,
          data_id,
          poster,
          title,
          japanese_title,
          description,
          tvInfo,
        };
      })
      .get();

    const serverData = await Promise.all(promises);
    return JSON.parse(JSON.stringify(serverData, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

export default extractSpotlights;
