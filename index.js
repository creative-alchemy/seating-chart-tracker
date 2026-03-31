const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  // 1. Set up the directory and filename using today's date
  const date = new Date().toISOString();
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

    await page.goto(url, { waitUntil: "networkidle2" });

    //  Wait for the page to navigate or for the seating chart to appear
    const chartSelector = ".reservedSeating-container"; // Your specific chart selector
    await page.waitForSelector(chartSelector, { timeout: 60000 }); // Give it a full minute to load

    // --- CAPTURE SCREENSHOT ---
    const element = await page.$(chartSelector);
    await element.screenshot({ path: filepath });
    console.log(`Successfully saved screenshot to ${filepath}`);

    // Rebuild a manifest so it always includes all screenshots after each capture.
    const manifestPath = `${dir}/manifest.json`;
    const screenshots = fs
      .readdirSync(dir)
      .filter((file) => file.toLowerCase().endsWith(".png"))
      .sort()
      .map((file) => ({
        filename: file,
        link: `screenshots/${file}`,
      }));

    const manifest = {
      updatedAt: new Date().toISOString(),
      screenshots,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Updated screenshot manifest at ${manifestPath}`);
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    process.exit(1); // Fails the GitHub Action if it breaks, so you get an alert
  } finally {
    await browser.close();
  }
})();
