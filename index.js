const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  // 1. Set up the directory and filename using today's date
  const date = new Date().toISOString().split("T")[0];
  const dir = "./screenshots";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filepath = `${dir}/seating-${date}.png`;

  // 2. Launch the browser (flags required for GitHub Actions)
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set a standard viewport
  await page.setViewport({ width: 1280, height: 800 });

  try {
    const url = process.env.EVENT_PAGE_URL;
    const password = process.env.EVENT_PAGE_PASSWORD;

    await page.goto(url, { waitUntil: "networkidle2" });

    // --- LOGIN STEPS ---
    // 1. Wait for the password field (Update the selector to match your page)
    const passwordSelector = 'input[type="password"]';
    await page.waitForSelector(passwordSelector);

    // 2. Type the password
    await page.type(passwordSelector, password);

    // 3. Click the submit button (Update this selector as well)
    // Often it's 'button[type="submit"]' or something similar
    const submitSelector = ".registration-closed button";
    await page.click(submitSelector);

    // 4. Wait for the page to navigate or for the seating chart to appear
    console.log("Logged in, waiting for seating chart...");
    const chartSelector = ".reservedSeating-container"; // Your specific chart selector
    await page.waitForSelector(chartSelector, { timeout: 60000 }); // Give it a full minute to load

    // --- CAPTURE SCREENSHOT ---
    const element = await page.$(chartSelector);
    await element.screenshot({ path: filepath });
    console.log(`Successfully saved screenshot to ${filepath}`);
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    process.exit(1); // Fails the GitHub Action if it breaks, so you get an alert
  } finally {
    await browser.close();
  }
})();
