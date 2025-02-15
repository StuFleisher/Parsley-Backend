import axios from "axios";

async function scrapeRecipeFromURL(url: string) {
  let scrapedRecipe = await axios.post("https://api.agentql.com/v1/query-data", {
    url,
    query: "{ recipes[] { ingredients[], instructions} }"
  }, {
    headers: {
      'Content-Type': "application/json",
      'X-API-Key': process.env.AGENTQL_KEY,
    }
  });
  return scrapedRecipe.data
}

export default scrapeRecipeFromURL