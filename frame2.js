const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://market.m.taobao.com/app/trip/fliggy-shop/pages/index?wh_weex=true&sellerId=4163445365&shopId=255024280&bizCode=hotel&wx_navbar_transparent=true&wx_navbar_hidden=true&ajson=1&parentCatId=0&refer=https%3A%2F%2Fmarket.m.taobao.com%2Fapp%2Ftrip%2Frx-search-all%2Fpages%2Flist%3FtitleBarHidden%3D2%26disableNav%3DYES%26nav%3DAUCTION%26keyword%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26searchType%3DMULTI_SEARCH%26fromSug%3D1%26_req_param_%3D%257B%2522searchQuery%2522%253A%2522book%2522%257D%26spm%3D181.7871893.x1998854401.dACItem1313-0%26prevquery%3Dbook%26gsclickquery%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26_projVer%3D1.1.10&spm=181.8947139.x2895152.dshop';
// const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';
// const url = 'https://market.m.taobao.com/app/fliggy-shop/rax-pi/pages/weex?sellerId=4163445365&shopId=255024280&bizCode=hotel&wx_navbar_transparent=true&wx_navbar_hidden=true&ajson=1&parentCatId=0&refer=https%3A%2F%2Fmarket.m.taobao.com%2Fapp%2Ftrip%2Frx-search-all%2Fpages%2Flist%3FtitleBarHidden%3D2%26disableNav%3DYES%26nav%3DAUCTION%26keyword%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26searchType%3DMULTI_SEARCH%26fromSug%3D1%26_req_param_%3D%257B%2522searchQuery%2522%253A%2522book%2522%257D%26spm%3D181.7871893.x1998854401.dACItem1313-0%26prevquery%3Dbook%26gsclickquery%3Dbooking%25E7%25BC%25A4%25E5%25AE%25A2%26_projVer%3D1.1.10&spm=181.8947139.x2895152.dshop&_w&bizId=4163445365&pagePath=index.htm&weexShopTabIndex=0&_inNestedEmbed=true&weexShopToken=1595587839006&weexShopTabId=0.0&inWeexShop=true&ignoreShopHeadEvent=false&weexShopTransparentBG=true&_page_inside_embed_=true&_page_home_isweex_=false&useIframeInWeb=false&backgroundTransparent=true';
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page1 = await browser.newPage();
  let page = page1;
  const deviceHeight = iPhone.viewport.height;
  const deviceWidth = iPhone.viewport.width;
  await page1.emulate(iPhone);
  await page1.goto(url, { waitUntil: ['networkidle0'] });
  await page1.waitFor(3000);

  const frames = page1.frames();
  if(frames.length > 1) {
    const frame = frames[1];
    const newUrl = frame.url();
    page = await browser.newPage();
    await page.emulate(iPhone);
    await page.goto(newUrl, { waitUntil: ['networkidle0'] });
    await page.bringToFront(); 
  }

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  const title = await page.title(); // 获取页面标题
  console.log(title);
  const finurl = await page.url();
  console.log(finurl);

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
    path: 'pics/f.jpg',
    type: 'jpeg',
    quality: 30,
    clip: {
      x: bounding_box.x,
      y: bounding_box.y,
      height: scrollHeight,
      width: deviceWidth,
    },
  });

  async function getBadLinks(page) {
    const tapLinks = [];
    const visitLink = async (index = 0) => {
      try {
        const spmLinks = await page.$$("[data-spm-click]:not([href*='//'])");
        const sellerLinks = await page.$$("[data-spmd]:not([href*='//'])");
        const links = spmLinks.concat(sellerLinks);
        console.log('spmLinks', spmLinks);
        console.log('sellerLinks', sellerLinks);

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

    const badLinks = [];

    const standardLinks = await page.evaluate(() => {
      const els = [...document.querySelectorAll("a[href*='//']")];
      return els.map((el) => {
          return el.href.trim();
      })
    });

    console.log('standardLinks', standardLinks);

    const totalLinks = tapLinks.concat(standardLinks);
    for(const link of totalLinks) {
      const res = await page.goto(link);
      const status = res.status();
      if(status >= 400) {
        badLinks.push(link);
      }
    }

    return badLinks; 
  }

  async function getPagePicUrl(page, deviceWidth) {
    const scrollableSectionEl = await page.$("#Puppeteer_Page_Box");
    const scrollHeight = await page.$eval(
      "#Puppeteer_Page_Box",
      el => el.scrollHeight
    );
    await page.setViewport({
      height: scrollHeight,
      width: deviceWidth,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      isLandscape: false
    });
    
    await page.waitFor(600);
    const bounding_box = await scrollableSectionEl.boundingBox();
    try {
        await scrollableSectionEl.screenshot({
            path: "page.jpg",
            type: "jpeg",
            quality: 30,
            clip: {
              x: bounding_box.x,
              y: bounding_box.y,
              height: scrollHeight,
              width: deviceWidth
            }
        });
    } catch(err) {
        console.log(err);
    }
    const tps = new TPS({
      accesstoken: "70efe599-f87d-4aad-861d-c99ee8a81f0a",
      private: true
    });
    let pagePicUrl = "";
    try {
      const ret = await tps.upload('page.jpg', {
        empId: "WORKER_1512551627933",
        nick: "水母君-飞猪质量平台",
        quality: 2
      });
      pagePicUrl = ret.url;
    } catch (e) {
    }
    return pagePicUrl;
  }

  async function getErrorImgList(page) {
    const bgImgInfoList = await page.evaluate(`(async() => {
      let bgImgs = [...document.querySelectorAll('div[placeholder]')];
      async function getBackgroundSize(elem) {
        const computedStyle = getComputedStyle(elem);
        const image = new Image();
        const reg = /\(\"(.+?)\"\)/;
        const matches = reg.exec(computedStyle.backgroundImage)[1] || [];
        const src = matches[1] || '';
        const cssSize = computedStyle.backgroundSize;
        const elemW = parseInt(computedStyle.width.replace('px', ''), 10);
        const elemH = parseInt(computedStyle.height.replace('px', ''), 10);
        const elemDim = [elemW, elemH];
        const computedDim = [];
        let ratio = 0;
        image.src = src;
        ratio = image.width > image.height ? image.width / image.height : image.height / image.width;
        const cssSizes = cssSize.split(' ');
        computedDim[0] = cssSizes[0];
        computedDim[1] = cssSizes.length > 1 ? cssSizes[1] : 'auto';
        const res = await fetch(src, {
          method: 'HEAD'
        });
        const size = res.headers.get('content-length');
        if(cssSizes[0] === 'cover') {
          if(elemDim[0] > elemDim[1]) {
              if(elemDim[0] / elemDim[1] >= ratio) {
                  computedDim[0] = elemDim[0];
                  computedDim[1] = 'auto';
              } else {
                  computedDim[0] = 'auto';
                  computedDim[1] = elemDim[1];
              }
          } else {
              computedDim[0] = 'auto';
              computedDim[1] = elemDim[1];
          }
        } else if(cssSizes[0] === 'contain') {
            if(elemDim[0] < elemDim[1]) {
                computedDim[0] = elemDim[0];
                computedDim[1] = 'auto';
            } else {
                if(elemDim[0] / elemDim[1] >= ratio) {
                    computedDim[0] = 'auto';
                    computedDim[1] = elemDim[1];
                } else {
                    computedDim[1] = 'auto';
                    computedDim[0] = elemDim[0];
                }
            }
        } else {
            for(var i = cssSizes.length; i--;) {
              if (cssSizes[i].indexOf('px') > -1) {
                computedDim[i] = cssSizes[i].replace('px', '');
              } else if (cssSizes[i].indexOf('%') > -1) {
                computedDim[i] = elemDim[i] * (cssSizes[i].replace('%', '') / 100);
              }
            }
        }
        if(computedDim[0] === 'auto' && computedDim[1] === 'auto') {
            computedDim[0] = image.width;
            computedDim[1] = image.height;
        } else {
          ratio = computedDim[0] === 'auto' ? image.height / computedDim[1] : image.width / computedDim[0];
          computedDim[0] = computedDim[0] === 'auto' ? image.width / ratio : computedDim[0];
          computedDim[1] = computedDim[1] === 'auto' ? image.height / ratio : computedDim[1];
        }
        return {
          src,
          size,
          width: computedDim[0],
          height: computedDim[1],
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        };
      }
      const promises = bgImgs.map(async el => {
        return await getBackgroundSize(el);
      });
      const list = await Promise.all(promises);
      return list;
    })()`);  
    
    const imgInfoList = await page.evaluate(`(async() => {
      const imgs = [...document.querySelectorAll('img')];
      console.log('imgs.length', imgs.length);
      let list = [];
      try {
        const promises = imgs.map(async img => {
          const res = await fetch(img.src, {
            method: 'HEAD'
          });
          const size = res.headers.get('content-length');
          return {
            src: img.src,
            width: img.width,
            height: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            size,
          };
        });
        list = await Promise.all(promises);
      } catch(err) {
        console.log(err);
      }
      
      return list;
    })()`);
  
    const imgList = bgImgInfoList.concat(imgInfoList);
    const errorImgList = []; // 图片尺寸要小于展示尺寸的2倍，且图片小于50KB
    const reg = /_(\d)*x(\d)*/;
  
    imgList.forEach(img => {
      if(!reg.test(img.src) && img.size > 10240) {
        errorImgList.push({
          ...img,
          errorCode: 'origin',
        });
      } else if(img.size > 51200) {
        errorImgList.push({
          ...img,
          errorCode: 'size',
        });
      } else if(img.naturalWidth > (img.width * 2)) {
        errorImgList.push({
          ...img,
          errorCode: 'suggest',
        });
      }
    });
    return errorImgList;
  }

  async function getMonitorData(page) {
    const monitorData = await page.evaluate(`(() => {  
      const getData = {};
      const performance = window.performance || window.msPerformance || window.webkitPerformance; // eslint-disable 
      const timing = performance.timing;
      const TIME_DATA = {
        cache: ['domainLookupStart', 'fetchStart'], // 读取缓存时间
        dns: ['domainLookupEnd', 'domainLookupStart'], // DNS 解析耗时
        tcp: ['connectEnd', 'connectStart'], // TCP 连接耗时
        req: ['responseStart', 'requestStart'], // 网络请求耗时
        res: ['responseEnd', 'responseStart'], // 数据传输耗时
        dom: ['domContentLoadedEventStart', 'domLoading'], // DOM 解析耗时
        readycb: ['domContentLoadedEventEnd', 'domContentLoadedEventStart'], // domContentLoaded回调函数耗时
        fasrt: ['domComplete', 'domContentLoadedEventEnd'], // 首屏异步资源加载耗时，即domContentLoaded和load之间加载的资源，一般为图片加载，JS异步加载的资源
        loadcb: ['loadEventEnd', 'loadEventStart'], // load回调函数耗时
        ready: ['domContentLoadedEventEnd', 'fetchStart'], // 	DOM Ready耗时，白屏时间
        load: ['loadEventEnd', 'fetchStart'] //	页面完全加载时间
      };
  
      Object.keys(TIME_DATA).map(item => {
        const firstParams = timing[TIME_DATA[item][0]];
        const secondParams = timing[TIME_DATA[item][1]];
        const value = Math.round(firstParams - secondParams);
        value >= 0 && value < 36e5 && (getData[item] = value);
      });
      return Promise.resolve(getData);
    })()`);
    return monitorData;
  }

  await browser.close();

})();

