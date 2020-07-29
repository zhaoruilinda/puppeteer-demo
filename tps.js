const fs = require('fs');
const path = require('path');

const TPS = require('@ali/tps-node');
const tps = new TPS({
  accesstoken: '70efe599-f87d-4aad-861d-c99ee8a81f0a',
  private: true,
});

(async () => {
    try{
        const ret = await tps.upload(path.join(__dirname, 'pics/new.jpg'), {
            empId: 'WORKER_1512551627933',
            nick: '水母君-飞猪质量平台',
            quality: 2,
        });
        
        const imgUrl = ret.url;
        console.log(imgUrl);
    } catch(e) {
        console.log(e);
    }
  
  
})();