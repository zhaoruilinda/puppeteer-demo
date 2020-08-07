export class PuppeteerTask {
  
    async create(params: any) {
      const categoryTaskId = Date.now();
      this.createTask({
          ...params,
          categoryTaskId,
      });
      return {
        categoryTaskId,
        categoryTaskStatus: 'running',
        categorySuccess: 'success',
      };
    }
  
    async createTask(params: any) {
      const {
        categoryTaskId,
        pageUrl = '',
        isLogin,
        loginName,
        loginPassword,
      } = params;
      let browser;
      let loginPage; // 登录页
      let page1;
      try {
        if(this.ctx.env == 'local') {
          browser = await puppeteer.launch({
            headless: true
          });
          if(isLogin == 'true') {
            loginPage = await browser.newPage();
            await loginPage.emulate(iPhone);
            await loginPage.goto('https://login.m.taobao.com/login.htm');
            await loginPage.type('#fm-login-id', loginName);    
            await loginPage.type('#fm-login-password', loginPassword);
            await loginPage.click('.fm-submit');
            await loginPage.waitForNavigation({
              waitUntil: 'load'
            });
            loginPage.close();
          }
          page1 = await browser.newPage();
        } else {
          if(isLogin == 'true') {
            loginPage = await this.ctx.getPage();
            await loginPage.emulate(iPhone);
            await loginPage.goto('https://login.m.taobao.com/login.htm');
            await loginPage.type('#fm-login-id', loginName);    
            await loginPage.type('#fm-login-password', loginPassword);
            await loginPage.click('.fm-submit');
            await loginPage.waitForNavigation({
              waitUntil: 'load'
            });
            loginPage.close();
          }
          page1 = await this.ctx.getPage();
        }
        let page = page1;
        const deviceHeight = iPhone.viewport.height;
        const deviceWidth = iPhone.viewport.width;
        await page1.emulate(iPhone);
        await page1.goto(pageUrl, {
          timeout: 60000,
          waitUntil: ["domcontentloaded", "load", "networkidle2"]
        });
        await page1.waitFor(4000);
  
        const frames = page1.frames();
        if(frames.length > 1) {
          const frame = frames[1];
          const newUrl = frame.url();
          if(this.ctx.env == 'local') {
            page = await browser.newPage();
          } else {
            page = await this.ctx.getPage();
          }      
          await page.emulate(iPhone);
          await page.goto(newUrl, {
            timeout: 60000,
            waitUntil: ["domcontentloaded", "load", "networkidle2"]
          });
          await page1.waitFor(4000);
          await page.bringToFront(); 
        }
  
        page.on("console", msg => {
          for (let i = 0; i < msg.args().length; ++i)
            console.log(`${i}: ${msg.args()[i]}`);
        });
  
        const title = await page.title(); // 获取页面标题
        console.log('title', title);
        const _pageUrl = await page.url(); // 获取页面地址
        console.log('pageUrl', _pageUrl);
  
        await page.evaluate(() => {
          const clientHeight = document.documentElement.clientHeight;
          const divs = [...document.querySelectorAll("div")];
          const len = divs.length;
          let boxEl = null;
          let i = 0;
          for (; i < len; i++) {
            const div = divs[i];
            if (div.scrollHeight > clientHeight) {
              boxEl = div;
              break;
            }
          }
          if (!boxEl && i === len) {
            boxEl = document.querySelector("body");
          }
          boxEl.setAttribute("id", "Puppeteer_Page_Box");
        });
  
        const scrollableSectionEl = await page.$("#Puppeteer_Page_Box");
  
        await page.evaluate((scrollableSectionEl, deviceHeight = 667) => {
          window.deviceHeight = deviceHeight;
          window.scrollableSectionEl = scrollableSectionEl;
        }, scrollableSectionEl, deviceHeight);
      
        // 页面滑动底部
        try {
          await page.evaluate(`(async () => {
            await new Promise((resolve, reject) => {
                let totalHeight = 0;
                let times = 0;
                let scrollEl;
                window.scrollableSectionEl.scrollTop = 10;
                if(window.scrollableSectionEl.scrollTop > 0) {
                  scrollEl = window.scrollableSectionEl;
                } else {
                  scrollEl = window;
                }
                const timer = setInterval(() => {
                    times++;
                    const scrollHeight = window.scrollableSectionEl.scrollHeight;
                    scrollEl.scrollBy(0, window.deviceHeight);
                    totalHeight = totalHeight + window.deviceHeight;
                    if (times > 9 || totalHeight >= scrollHeight) {
                      clearInterval(timer);
                      resolve();
                    }
                }, 2000);
            });
        })()`);
        } catch(err) {
            console.log(err);
        }
  
        const scrollHeight = await page.$eval('#Puppeteer_Page_Box', el => el.scrollHeight);
        console.log('scrollHeight', scrollHeight);
  
        // 图片截图
        const pagePicUrl = await this.getPagePicUrl(page, deviceWidth);
        console.log('pagePicUrl', pagePicUrl);
  
        // 图片检测
        const {
          errorImgList = [],
          repeatImgs = [],
        } = await this.getErrorImgList(page);
        console.log('errorImgList', errorImgList);
        console.log('repeatImgs', repeatImgs);
  
        // 死链检测
        const badLinks = await this.getBadLinks(page);
        console.log('badLinks', badLinks);
  
        // 性能检测
        const monitorData = await this.getMonitorData(page);
        console.log(monitorData);
  
        this.ctx.logger.info([title, _pageUrl, pagePicUrl, errorImgList.length, repeatImgs.length, badLinks.length].join('|'));
        
        const categoryResultDetails = {
            title,
            pagePicUrl,
            badLinks,
            errorImgList,
            repeatImgs,
            monitorData
        }
        const categoryResultDetailsStr = JSON.stringify(categoryResultDetails);
        const updates = {
          categoryResultDetails: categoryResultDetailsStr,
          categoryTaskStatus: 'success',
        };
        console.log('IPuppeteerTask categoryTaskId', categoryTaskId);
        const updateResult = await this.TaskModel.update(updates, { where: { categoryTaskId } });
        console.log('updateResult', updateResult);
        // console.log('categoryResultDetails', categoryResultDetails);
  
        if(this.ctx.env == 'local') {
          await browser.close();
        } else {
          if(frames.length > 1) { 
            page.close();
          }
          page1.close();
        }
      } catch(e) {
        console.log('puppeteer启动失败', JSON.stringify(e));
        this.logger.error(new Error('puppeteer启动失败' + JSON.stringify(e)));
      }
  
    }
  
    async getBadLinks(page) {
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
  
      const badLinks = [];
  
      const standardLinks = await page.evaluate(() => {
        const els = [...document.querySelectorAll("a[href*='//']")];
        return els.map((el:any) => {
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
  
      return badLinks; 
    }
  
    async getPagePicUrl(page, deviceWidth) {
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
  
    async getErrorImgList(page) {
      await page.evaluate(() => {
        const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
        window.base64Reg = base64Reg;
      });
  
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
          
          const isBase64 = window.base64Reg.test(src);
          let size = 0;
          if(isBase64){
            let str = src.replace('data:image/png;base64,', '');
            str = src.replace('data:image/jpg;base64,', '');
            str = src.replace('data:image/gif;base64,', '');
            const equalIndex = str.indexOf('=');
            if (str.indexOf('=') > 0) {
                str = str.substring(0, equalIndex);
            }
            const strLength = str.length;
            size = parseInt(strLength - (strLength / 8) * 2);
          } else {
            const res = await fetch(src, {
              method: 'HEAD'
            });
            size = res.headers.get('content-length');
          }
  
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
        let list = [];
        try {
          const promises = imgs.map(async img => {
            let size = 0;
            const src = img && img.src || '';
            const isBase64 = window.base64Reg.test(src);
            if(isBase64){
              let str = src.replace('data:image/png;base64,', '');
              str = src.replace('data:image/jpg;base64,', '');
              str = src.replace('data:image/gif;base64,', '');
  
              const equalIndex = str.indexOf('=');
              if (str.indexOf('=') > 0) {
                str = str.substring(0, equalIndex);
              }
              const strLength = str.length;
              size = parseInt(strLength - (strLength / 8) * 2);
            } else {
              const res = await fetch(src, {
                method: 'HEAD'
              });
              size = res.headers.get('content-length');
            }
            return {
              src,
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
      // 过滤箭头等icon图片
      const filterImgList = imgList.filter(item => {
        const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
        const isBase64 = base64Reg.test(item.src);
        return (!isBase64 && (item.height >= 50 || item.width >= 50));
      });
  
      await page.evaluate(filterImgList => {
        window.filterImgList = filterImgList;
      }, filterImgList);
  
      const newImgList = await page.evaluate(`(async () => {
        function createImgData(dataDetail) {
          var _a;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const imgWidth = Math.sqrt(dataDetail.length / 4);
          const newImageData = (_a = ctx) === null || _a === void 0 ? void 0 : _a.createImageData(imgWidth, imgWidth);
          for (let i = 0; i < dataDetail.length; i += 4) {
              let R = dataDetail[i];
              let G = dataDetail[i + 1];
              let B = dataDetail[i + 2];
              let Alpha = dataDetail[i + 3];
              newImageData.data[i] = R;
              newImageData.data[i + 1] = G;
              newImageData.data[i + 2] = B;
              newImageData.data[i + 3] = Alpha;
          }
          return newImageData;
        }
        function createGrayscale(imgData) {
          const imgDataLen = imgData && imgData.data && imgData.data.length || 0;
          if(imgDataLen > 0) {
            const newData = Array(imgDataLen);
            newData.fill(0);
            imgData.data.forEach((_data, index) => {
              if ((index + 1) % 4 === 0) {
                  const R = imgData.data[index - 3];
                  const G = imgData.data[index - 2];
                  const B = imgData.data[index - 1];
                  const gray = ~~((R + G + B) / 3);
                  newData[index - 3] = gray;
                  newData[index - 2] = gray;
                  newData[index - 1] = gray;
                  newData[index] = 255;
              }
            });
            return createImgData(newData);
          }
  
        }
        function getAHashFingerprint(imgData) {
            const grayList = imgData.data.reduce((pre, cur, index) => {
                if ((index + 1) % 4 === 0) {
                    pre.push(imgData.data[index - 1]);
                }
                return pre;
            }, []);
            const length = grayList.length;
            const grayAverage = grayList.reduce((pre, next) => (pre + next), 0) / length;
            return grayList.map(gray => (gray >= grayAverage ? 1 : 0)).join('');
        }
        const imgList = window.filterImgList || [];
        const newImgList = [].concat(imgList);
  
        for(let img of newImgList) {
          const src = img.src || '';
          const originSrcs = /([a-z|A-Z|0-9|_|!|\.|\/|-])*?\.(png|jpg)/.exec(src) || [];
          const originSrc = originSrcs[0] || '';
          async function compressImg(src, imgWidth = 8){
            return new Promise(function(resolve){
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const image = new Image();
              image.crossOrigin = 'Anonymous';
              image.onload = function(){
                var _a, _b;
                canvas.width = imgWidth;
                canvas.height = imgWidth;
                (_a = ctx) === null || _a === void 0 ? void 0 : _a.drawImage(image, 0, 0, imgWidth, imgWidth);
                const data = (_b = ctx) === null || _b === void 0 ? void 0 : _b.getImageData(0, 0, imgWidth, imgWidth);
                resolve(data);
              }
              image.onerror = function(){
                resolve("");
              }
              image.src = src;
            });
          }
          const imgData = await compressImg(originSrc);
          if(imgData) {
            const grayImgData = createGrayscale(imgData);
            const hash = getAHashFingerprint(grayImgData);
            img.hash = hash;
          } else {
            img.hash = '';
          }
        }
  
        return newImgList;
      })()`);
  
      function getHammingDistance(str1, str2) {
        let distance = 0;
        const str1Arr = str1.split('');
        const str2Arr = str2.split('');
        distance = Math.abs(str1Arr.length - str2Arr.length);
        str1Arr.forEach((letter, index) => {
          if (letter !== str2Arr[index]) {
            distance++;
          }
        });
        return distance;
      }
      const len = newImgList.length;
      const repeatImgs = [];
      
      for(let i = 0; i < len - 1; i++) {
        for(let j = i + 1; j < len; j++) {
          const hash1 = newImgList[i].hash || '';
          const hash2 = newImgList[j].hash || '';
          const hammingDistance = getHammingDistance(hash1, hash2);
          const hammingSimilarity = ((hash1.length - hammingDistance) / hash1.length).toFixed(2);
          if(Number(hammingSimilarity) >= 0.95) {
            repeatImgs.push({
              src1: newImgList[i].src,
              src2: newImgList[j].src,
              hammingSimilarity,
            });
          }
        }
      }
  
      const errorImgList = []; // 图片尺寸要小于展示尺寸的3倍，且图片小于50KB
      const reg = /_(\d)*x(\d)*/;
      const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
    
      imgList.forEach(img => {
        const isBase64 = base64Reg.test(img.src);
        if(isBase64 && img.size > 10240) {
          const index = errorImgList.findIndex(item => {
            return (item.errorCode == 'base64' && img.src == item.src);
          });
          if(index == -1) {
            errorImgList.push({
              ...img,
              errorCode: 'base64',
            });
          }
        } else if(!reg.test(img.src) && img.size > 10240 && img.src.indexOf('.gif') == -1) {
          const index = errorImgList.findIndex(item => {
            return (item.errorCode == 'origin' && img.src == item.src);
          });
          if(index == -1) {
            errorImgList.push({
              ...img,
              errorCode: 'origin',
            });
          }
        } else if(img.size > 51200) {
          const index = errorImgList.findIndex(item => {
            return (item.errorCode == 'size' && img.src == item.src);
          });
          if(index == -1) {
            errorImgList.push({
              ...img,
              errorCode: 'size',
            });
          }
        } else if(img.naturalWidth > (img.width * 3) || img.naturalHeight > (img.height * 3)) {
          const index = errorImgList.findIndex(item => {
            return (item.errorCode == 'suggest' && img.src == item.src);
          });
          if(index == -1) {
            errorImgList.push({
              ...img,
              errorCode: 'suggest',
            });
          }
        }
      });
  
      return {
        errorImgList,
        repeatImgs,
      };
    }
  
    async getMonitorData(page) {
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
  
  }