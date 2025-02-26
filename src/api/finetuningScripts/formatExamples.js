import fs from "node:fs";
import examples from "./data/examples.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHORT_BASE_PROMPT =  (
  `Your job is to structure recipe data into JSON.
  I will give you the text of a recipe.  I would like you to convert it into
  structured JSON following these rules.
  1 - Maintain the original text and intent of the recipe whenever possible.
  2 - Create a new step whenever the recipe asks us to measure time, switch equipment, change contexts, or whenever it otherwise makes intuitive sense.
  3 - Favor more simple steps over fewer, more involved steps.
  4 - Ignore existing headers and other stray content that may have been pasted into the recipe by accident.
  5 - Respond in the following JSON format: { \"$schema\": \"http://json-schema.org/draft-07/schema#\", \"$id\": \"http://parsley.stufleisher.com/recipeGenerated.schema.json\", \"type\": \"object\", \"properties\": { \"name\": { \"type\": \"string\" }, \"owner\": { \"type\": \"string\" }, \"description\": { \"type\": \"string\" }, \"sourceName\": { \"type\": \"string\" }, \"steps\": { \"type\": \"array\", \"items\": { \"type\": \"object\", \"properties\": { \"stepNumber\": { \"type\": \"integer\" }, \"instructions\": { \"type\": \"string\" }, \"ingredients\": { \"type\": \"array\", \"items\": { \"type\": \"object\", \"properties\": { \"amount\": { \"type\": \"string\" }, \"description\": { \"type\": \"string\" }, \"instructionRef\": { \"type\": \"string\" } }, \"additionalProperties\": false, \"required\": [\"amount\", \"description\", \"instructionRef\"] } } }, \"additionalProperties\": false, \"required\": [\"stepNumber\", \"ingredients\", \"instructions\"] } }, \"tags\": { \"type\": \"array\", \"items\": { \"type\": \"object\", \"properties\": { \"name\": { \"type\": \"string\" } }, \"additionalProperties\": false, \"required\": [\"name\"] } } }, \"additionalProperties\": false, \"required\": [\"name\", \"owner\", \"description\", \"sourceName\", \"steps\", \"tags\"] }.
  `
)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'data', `fineTuning_${getTimestamp()}.jsonl`);

// const MODEL = "gpt-4o-2024-08-06";

async function convertToJSONL() {

  try {
    const jsonlData = Object.entries(examples)
      .map(([key, value]) => JSON.stringify({
        messages: [{
          role: "system",
          content: SHORT_BASE_PROMPT
        }, {
          role: "user",
          content: value.request
        }, {
          role: "assistant",
          content: JSON.stringify(value.response)
        }]
      }))
      .join('\n');

    // Write the JSONL file
    await fs.promises.writeFile(filePath,
      jsonlData,
      err => {
        if (err) {
          console.error(err);
        } else {
          // file written successfully
        }
      });
    console.log("success");
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:T]/g, '-').split('.')[0];
}

await convertToJSONL();