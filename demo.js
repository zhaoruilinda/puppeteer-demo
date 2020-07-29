const puppeteer = require('puppeteer');

const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://h5.m.taobao.com/trip/home/index.html';
const aUrl = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  
  await page.setUserAgent(iPhone.userAgent);
  const deviceHeight = iPhone.viewport.height;
  const deviceWidth = iPhone.viewport.width;
  await page.setViewport({
    height: deviceHeight,
    width: deviceWidth,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  });
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

  await page.evaluate(async scrollableSectionEl => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let times = 0;
      const deviceHeight = 667;
      const timer = setInterval(() => {
          times++;
          const scrollHeight = scrollableSectionEl.scrollHeight;
          scrollableSectionEl.scrollBy(0, deviceHeight);
          totalHeight = totalHeight + deviceHeight;
          if(times > 10 || totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
      }, 2000);
    });
  }, scrollableSectionEl);

  const scrollHeight = await page.$eval('#Puppeteer_Page_Box', el => el.scrollHeight);
  console.log('scrollHeight', scrollHeight);

  await page.setViewport({
    height: scrollHeight || deviceHeight,
    width: deviceWidth,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  });

  const bounding_box = await scrollableSectionEl.boundingBox();

  await scrollableSectionEl.screenshot({
    path: 'pics/finally.png',
    clip: {
      x: bounding_box.x,
      y: bounding_box.y,
      height: scrollHeight || deviceHeight,
      width: deviceWidth,
    },
  });

  // await scrollableSectionEl.screenshot({
  //   path: 'pics/bb.png',
  //   fullPage: true,
  // });

  // await page.evaluate(async (selector) => {
  //   await new Promise((resolve, reject) => {
  //     const scrollableSection = document.querySelector(selector);
  //     let totalHeight = 0;
  //     const distance = 400;
  //     const timer = setInterval(() => {
  //         console.log('scrollHeight', scrollHeight);
  //         const scrollHeight = scrollableSection.scrollHeight;
  //         scrollableSection.scrollBy(0, distance);
  //         totalHeight += distance;
  //         console.log('totalHeight', totalHeight);
  //         if(totalHeight >= scrollHeight){
  //           clearInterval(timer);
  //           resolve();
  //         }
  //       }, 100);
  //   });
  // }, scrollable_section);

  // const divImgUrls = await page.evaluate(() => {
  //   let imgs = [...document.querySelectorAll('div[placeholder]')];
  //   const imgurls = [];
  //   imgs.forEach((img) =>{
  //     const reg = /\(\"(.+?)\"\)/;
  //     const imgUrl = window.getComputedStyle(img).getPropertyValue('background-image');
  //     if(imgUrl && reg.test(imgUrl)) {
  //       matches = reg.exec(imgUrl);
  //       if(matches && matches.length > 1) {
  //         imgurls.push(matches[1]);
  //       }
  //     }
  //   });
  //   return imgurls;
  // });
  // console.log('divImgUrls', divImgUrls);

  // const urls = await page.evaluate(() => {
  //   var links = [...document.querySelectorAll('a')];
  //   return links.map(el => {
  //       return el.href.trim();
  //   })
  // });

  // await page.screenshot({path: 'pics/aa.png', fullPage: true});

  await browser.close();
})();

async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}