
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';


(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
  });
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto(url, { waitUntil: ['networkidle0'] });

  const performanceTiming = JSON.parse(
    await page.evaluate(() => {
      const performance = window.performance || window.msPerformance || window.webkitPerformance;
      const timing = performance.timing;
      return JSON.stringify(timing);
    })
  );
  console.log(performanceTiming);
  
})();
