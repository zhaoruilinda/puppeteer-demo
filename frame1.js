const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://market.m.taobao.com/app/trip/fliggy-shop/pages/index?wh_weex=true&sellerId=4163445365&shopId=255024280&bizCode=hotel&wx_navbar_transparent=true&wx_navbar_hidden=true&ajson=1&parentCatId=0&refer=https%3A%2F%2Fmarket.m.taobao.com%2Fapp%2Ftrip%2Frx-search-all%2Fpages%2Flist%3FtitleBarHidden%3D2%26disableNav%3DYES%26nav%3DAUCTION%26keyword%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26searchType%3DMULTI_SEARCH%26fromSug%3D1%26_req_param_%3D%257B%2522searchQuery%2522%253A%2522book%2522%257D%26spm%3D181.7871893.x1998854401.dACItem1313-0%26prevquery%3Dbook%26gsclickquery%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26_projVer%3D1.1.10&spm=181.8947139.x2895152.dshop';
// const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';
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

  await page.goto(url, { waitUntil: ['networkidle0'] });
  await page.waitFor(3000);

  console.log('--------------');
  const frames = page.frames();
  if(frames.length > 1) {
    const frame = frames[1];
    await frame.evaluate(() => {
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
    
    const scrollableSectionEl = await frame.$('#Puppeteer_Page_Box');
    await frame.evaluate(async (scrollableSectionEl, deviceHeight = 667) => {
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
  
    const scrollHeight = await frame.$eval('#Puppeteer_Page_Box', el => el.scrollHeight);
    console.log('scrollHeight', scrollHeight);
  }
  await browser.close();
})();
