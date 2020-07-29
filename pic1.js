const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

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

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  // await page.setRequestInterception(true);

  // page.on('request', async interceptedRequest => {
  //     if (interceptedRequest.resourceType() === 'image') {
  //         // interceptedRequest.abort();
  //         // const response = await fetch(interceptedRequest.url(), {
  //         //   method: 'HEAD'
  //         // });
          // const response = await fetch(interceptedRequest.url(), {
          //   method: 'HEAD'
          // });
  //         const imgUrl = interceptedRequest.url();
  //         console.log('imgUrl', imgUrl);
  //         if (response.ok) {
  //             const sizeOfImage = response.headers.get('content-length');

  //             console.log('sizeOfImage', sizeOfImage);
  //         } else {
  //             // something went wrong...
  //         }
  //     } else {
  //         interceptedRequest.continue();
  //     }
  // });

  await page.goto(url, { waitUntil: ['networkidle0'] });

  let title = await page.title(); // 获取页面标题
  console.log(title);
 
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



 

  await browser.close();
})();
