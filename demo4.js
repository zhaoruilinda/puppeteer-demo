const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TPS = require('@ali/tps-node');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  const deviceHeight = iPhone.viewport.height;
  const deviceWidth = iPhone.viewport.width;
  await page.emulate(iPhone);
  await page.goto(url, { waitUntil: ['networkidle0'] });

  let title = await page.title(); // 获取页面标题
  console.log(title);

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
 
  await page.evaluate(() => {
    const clientHeight = document.documentElement.clientHeight;
    const divs = [...document.querySelectorAll('div')];
    const len = divs.length;
    let boxEl = null;
    let i = 0; 
    for(; i < len; i++) {
      const div = divs[i];
      if(div.scrollHeight > clientHeight)  {
        boxEl = div;
        break;
      }
    }
    if(!boxEl && i === len) {
      boxEl = document.querySelector('body');
    }
    boxEl.setAttribute('id', 'Puppeteer_Page_Box');
  });
  
  
  const scrollableSectionEl = await page.$('#Puppeteer_Page_Box');

  await page.evaluate(async (scrollableSectionEl, deviceHeight = 667) => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let times = 0;
      const timer = setInterval(() => {
          times++;
          const scrollHeight = scrollableSectionEl.scrollHeight;
          console.log('scrollHeight', scrollHeight);
          scrollableSectionEl.scrollBy(0, deviceHeight);
          totalHeight = totalHeight + deviceHeight;
          if(times > 5 || totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
      }, 2000);
    });
  }, scrollableSectionEl, deviceHeight);

  const scrollHeight = await page.$eval('#Puppeteer_Page_Box', el => el.scrollHeight);
  console.log('scrollHeight', scrollHeight);

  await page.setViewport({
    height: scrollHeight,
    width: deviceWidth,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  });

  const bounding_box = await scrollableSectionEl.boundingBox();
  await page.waitFor(600);
  console.log('bounding_box', bounding_box);

  await scrollableSectionEl.screenshot({
    path: 'pics/page.jpg',
    type: 'jpeg',
    quality: 30,
    clip: {
      x: bounding_box.x,
      y: bounding_box.y,
      height: scrollHeight,
      width: deviceWidth,
    },
  });

  const tps = new TPS({
    accesstoken: '70efe599-f87d-4aad-861d-c99ee8a81f0a',
    private: true,
  });

  let imgUrl = '';
  try{
    const ret = await tps.upload(path.join(__dirname, 'pics/page.jpg'), {
        empId: 'WORKER_1512551627933',
        nick: '水母君-飞猪质量平台',
        quality: 2,
    });
    imgUrl = ret.url;
    console.log(imgUrl);
  } catch(e) {
    console.log(e);
  }

  

  await browser.close();
})();
