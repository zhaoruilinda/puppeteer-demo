const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://donate.mozilla.org/en-US/?presets=50,30,20,10&amount=30&utm_source=mozilla.org&utm_medium=referral&utm_content=nav&currency=usd';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto(url, { waitUntil: ['networkidle0'] });

  await page.screenshot({path: 'pics/mdc.png', fullPage: true});

  await browser.close();
})();