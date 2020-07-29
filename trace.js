const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

(async () => {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();

        await page.emulate(iPhone);

        await page.tracing.start({path: './trace.json'});
        await page.goto('https://market.m.taobao.com/app/trip/fliggy-shop/pages/index?wh_weex=true&sellerId=263682007&shopId=58498548&bizCode=hotel&wx_navbar_transparent=true&wx_navbar_hidden=true&null');
        await page.tracing.stop();

        browser.close();
    
})();
