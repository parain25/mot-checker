// Make sure to create a package.json with dependencies: express, puppeteer, cors
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());

// Enable CORS for frontend hosted elsewhere
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Adjust in production
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.post('/api/mot-status', async (req, res) => {
    const { registration } = req.body;

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
        const page = await browser.newPage();

        const url = `https://vehicleenquiry.service.gov.uk/VehicleResults?Vrm=${registration}`;

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for the result element to appear
        await page.waitForSelector('.mot-status, .mot-expiry', { timeout: 10000 }).catch(() => null);

        // Extract data
        const data = await page.evaluate(() => {
            const statusEl = document.querySelector('.mot-status');
            const expiryEl = document.querySelector('.mot-expiry');

            return {
                status: statusEl ? statusEl.innerText.trim() : 'Unknown',
                expiryDate: expiryEl ? expiryEl.innerText.trim() : 'Unknown'
            };
        });

        await browser.close();

        res.json({ success: true, status: data.status, expiryDate: data.expiryDate });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
