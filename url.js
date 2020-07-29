const puppeteer = require('puppeteer');

const iPhone = puppeteer.devices['iPhone 6'];
// const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';
const url = 'https://market.m.taobao.com/app/fliggy-shop/rax-pi/pages/weex?wh_weex=true&bizId=4163445365&bizCode=hotel&pagePath=custom-1549653977762.htm&shopId=255024280&spm=181.11557699.splitpicture_5252043.splitpicture_5252043_0';
// const url = 'https://h5.m.taobao.com/trip/flight-search/searchlist/index.html?searchType=1&leaveDate=2020-07-21&containChild=0&containInfant=0&agentIds=&depCityCode=BJS&depCityName=%E5%8C%97%E4%BA%AC&arrCityCode=HGH&arrCityName=%E6%9D%AD%E5%B7%9E&spm=181.11925144.10840050.d10&_fli_webview=&_fli_online=&program_type=H5&ttid=201300%40travel_h5_3.1.0&_preProjVer=1.19.1&_projVer=1.3.3';

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

  const tapLinks = [];
  const visitLink = async (index = 0) => {
    try {
      const spmLinks = await page.$$("[data-spm-click]:not([href*='//'])");
      const sellerLinks = await page.$$("[data-spmd]:not([href*='//'])");
      const links = spmLinks.concat(sellerLinks);
      if (links[index]) {
        await links[index].tap();
        await page.waitForNavigation({
          timeout: 5000,
          waitUntil: 'load'
        });
        const currentPage = await page.url();
        tapLinks.push(currentPage);
        await page.goBack({ waitUntil: "networkidle0" });
        return visitLink(index + 1);
      }
    } catch(err) {
      await visitLink(index + 1);
    }
  };
  await visitLink();
  
  console.log(tapLinks);

  const badLinks = [];

  const standardLinks = await page.evaluate(() => {
    const els = [...document.querySelectorAll("a[href*='//']")];
    return els.map(el => {
        return el.href.trim();
    })
  });


  const totalLinks = tapLinks.concat(standardLinks);
  for(const link of totalLinks) {
    const res = await page.goto(link);
    const status = res.status();
    if(status >= 400) {
      badLinks.push(link);
    }
  }

  console.log('badLinks.length', badLinks.length);
  await browser.close();
})();
