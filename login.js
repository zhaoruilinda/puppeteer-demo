const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];

(async () => {
        const browser = await puppeteer.launch({
          headless: false,
        });

        const loginPage = await browser.newPage();
        await loginPage.emulate(iPhone);
        await loginPage.goto('https://login.m.taobao.com/login.htm');
        await loginPage.type('#fm-login-id', '15010583923');    
        await loginPage.type('#fm-login-password', 'zhaolaoshi520');
        await loginPage.click('.fm-submit');
        await loginPage.waitForNavigation({
          waitUntil: 'load'
        });
        loginPage.close();

        const page = await browser.newPage();
        await page.emulate(iPhone);
        await page.goto('https://market.m.taobao.com/app/trip/h5-olist/pages/order/index.html?_projVer=1.6.0', { waitUntil: ['load', 'networkidle2'] });
        await page.screenshot({path: 'pics/example.png'});//截个图
        browser.close();
    
})();
