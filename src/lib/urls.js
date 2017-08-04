// @flow
'use strict'

const urls = (version:number = 17) => {
  return {
    referer: `https://www.easports.com/iframe/fut${version}/?baseShowoffUrl=https%3A%2F%2Fwww.easports.com%2Fde%2Ffifa%2Fultimate-team%2Fweb-app%2Fshow-off&guest_app_uri=http%3A%2F%2Fwww.easports.com%2Fde%2Ffifa%2Fultimate-team%2Fweb-app&locale=en_US`,
    login: {
      main: 'https://www.easports.com/fifa/ultimate-team/web-app',
      nucleus: `https://www.easports.com/iframe/fut${version}/?locale=en_US&baseShowoffUrl=https%3A%2F%2Fwww.easports.com%2Fde%2Ffifa%2Fultimate-team%2Fweb-app%2Fshow-off&guest_app_uri=http%3A%2F%2Fwww.easports.com%2Fde%2Ffifa%2Fultimate-team%2Fweb-app`,
      personas: 'https://www.easports.com/fifa/api/personas',
      shards: `https://www.easports.com/iframe/fut${version}/p/ut/shards/v2`,
      accounts: `https://www.easports.com/iframe/fut${version}/p/ut/game/fifa${version}/user/accountinfo?sku=FUT${version}WEB&returningUserGameYear=2015&_=`,
      session: `https://www.easports.com/iframe/fut${version}/p/ut/auth`,
      question: `https://www.easports.com/iframe/fut${version}/p/ut/game/fifa${version}/phishing/question?redirect=false&_=`,
      validate: `https://www.easports.com/iframe/fut${version}/p/ut/game/fifa${version}/phishing/validate?_=`,
      validateCaptcha: `https://www.easports.com/iframe/fut${version}/p/ut/captcha/validate`,
      captchaImg: `https://www.easports.com/iframe/fut${version}/p/ut/captcha/img?token=AAAA&_=`
    },
    api: {
      userInfo: `/ut/game/fifa${version}/usermassinfo`,
      credits: `/ut/game/fifa${version}/user/credits`,
      tradepile: `/ut/game/fifa${version}/tradepile`,
      removeFromTradepile: `/ut/game/fifa${version}/trade/{0}`,
      watchlist: `/ut/game/fifa${version}/watchlist`,
      pilesize: `/ut/game/fifa${version}/clientdata/pileSize`,
      relist: `/ut/game/fifa${version}/auctionhouse/relist`,
      transfermarket: `/ut/game/fifa${version}/transfermarket?`,
      placebid: `/ut/game/fifa${version}/trade/{0}/bid`,
      listItem: `/ut/game/fifa${version}/auctionhouse`,
      status: `/ut/game/fifa${version}/trade/status?`,
      item: `/ut/game/fifa${version}/item`,
      squadList: `/ut/game/fifa${version}/squad/list`,
      squadDetails: `/ut/game/fifa${version}/squad/{0}`,
      sold: `/ut/game/fifa${version}/trade/sold`,
      unassigned: `/ut/game/fifa${version}/purchased/items`
    },
    resource: {
      player: ''
    }
  }
}

module.exports = urls
