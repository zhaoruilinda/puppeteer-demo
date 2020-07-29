const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const iPhone = puppeteer.devices['iPhone 6'];
// const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';
const url = 'https://market.m.taobao.com/app/fliggy-shop/rax-pi/pages/weex?wh_weex=true&bizId=4163445365&bizCode=hotel&pagePath=custom-1549653977762.htm&shopId=255024280&spm=181.11557699.splitpicture_5252043.splitpicture_5252043_0';
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

  const bgImgInfoList = await page.evaluate(async () => {
    let bgImgs = [...document.querySelectorAll('div[placeholder]')];
    console.log('bgImgs.length', bgImgs.length);
    async function getBackgroundSize(elem) {
      var computedStyle = getComputedStyle(elem),
          image = new Image(),
          src = computedStyle.backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2'),
          cssSize = computedStyle.backgroundSize,
          elemW = parseInt(computedStyle.width.replace('px', ''), 10),
          elemH = parseInt(computedStyle.height.replace('px', ''), 10),
          elemDim = [elemW, elemH],
          computedDim = [],
          ratio;
      image.src = src;
      ratio = image.width > image.height ? image.width / image.height : image.height / image.width;
      cssSize = cssSize.split(' ');
      computedDim[0] = cssSize[0];
      computedDim[1] = cssSize.length > 1 ? cssSize[1] : 'auto';
      const res = await fetch(src, {
        method: 'HEAD'
      });
      const size = res.headers.get('content-length');
      if(cssSize[0] === 'cover') {
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
      } else if(cssSize[0] === 'contain') {
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
          for(var i = cssSize.length; i--;) {
            if (cssSize[i].indexOf('px') > -1) {
              computedDim[i] = cssSize[i].replace('px', '');
            } else if (cssSize[i].indexOf('%') > -1) {
              computedDim[i] = elemDim[i] * (cssSize[i].replace('%', '') / 100);
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
  });  
  
  const imgInfoList = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    console.log('imgs.length', imgs.length);
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
    const list = await Promise.all(promises);
    return list;
  });

  const imgList = bgImgInfoList.concat(imgInfoList);
  console.log('imgList.length', imgList.length);
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
  console.log(errorImgList);

  await browser.close();
})();
