const { wrap, configure } = require('agentql');
const { chromium } = require('playwright');

configure({ apiKey: process.env.AGENTQL_API_KEY });

async function main() {
    const browser = await chromium.launch({headless: false});
    const page = await wrap(await browser.newPage());
    await page.goto('https://docs.agentql.com/quick-start');

    // Find "Search" button using Smart Locator
    const searchButton = await page.getByPrompt('search button');
    // Interact with the button
    await searchButton.click();

    // Define a query for modal dialog's search input
    const SEARCH_BOX_QUERY = `
    {
        modal {
            search_box
        }
    }
    `

    // Get the modal's search input and fill it with "Quick Start"
    let response = await page.queryElements(SEARCH_BOX_QUERY);
    await response.modal.search_box.fill("Quick Start");

    // Define a query for the search results
    const SEARCH_RESULTS_QUERY = `
    {
        modal {
            search_box
            search_results {
                items[]
            }
        }
    }
    `

    // Execute the query after the results have returned then click on the first one
    response = await page.queryElements(SEARCH_RESULTS_QUERY);
    await response.modal.search_results.items[0].click();


    // Used only for demo purposes. It allows you to see the effect of the script.
    await page.waitForTimeout(10000);

    await browser.close();
}

main();