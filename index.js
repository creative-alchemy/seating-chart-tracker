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
    // --- STEP 1: CONDITIONAL LOGIN ---
    const passwordSelector = 'input[type="password"]';
    const needsLogin = await page.$(passwordSelector); // Returns null if not found

    if (needsLogin) {
      console.log("Password protection detected. Logging in...");
      const password = process.env.EVENT_PAGE_PASSWORD;
      await page.type(passwordSelector, password);

      const submitSelector = ".registration-closed button"; // Update to your actual button
      await page.click(submitSelector);

      // Wait for the next page to load after clicking submit
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    } else {
      console.log("No password protection found. Proceeding to chart...");
    }

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
