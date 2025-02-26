import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import examples from "./data/examples.js";
import { argv } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'data', 'examples.js');

const requestId = argv[2];
await getRawRequestData(requestId);

/**
 * Formats a JavaScript object as a properly formatted JavaScript code string.
 * This maintains proper indentation and formatting.
 */
function formatAsJavaScriptObject(obj) {
  return JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Only unquote object keys
}

/**Pulls recipe request records from the database and writes them to a .js file
 * as an object format for editing
*/
async function getRawRequestData(requestId) {

  const prisma = new PrismaClient();
  const request = await prisma.generationRequest.findUniqueOrThrow({
    where: { requestId: +requestId }
  }
  );

  let result = examples;
  result[requestId] = {
    request: request.requestText,
    response: JSON.parse(request.response),
  };

  console.log(examples)

  await fs.promises.writeFile(filePath,
    `const examples = ${formatAsJavaScriptObject(result)};
    export default examples;
    `,
    err => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
      }
    });

    process.exit(0)
}