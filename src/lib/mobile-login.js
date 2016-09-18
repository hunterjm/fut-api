import request from 'request'
import Promise from 'bluebird'
import cheerio from 'cheerio'
import assert from 'assert'
import urlModule from 'url'
import _ from 'underscore'

const crypto = Promise.promisifyAll(require('crypto'))

// const request = Promise.promisifyAll(requestDef)

const jar = request.jar()
const requestConfigObj = {
  jar: jar,
  followAllRedirects: true,
  gzip: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Mobile/14A403',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.8'
  }
}

const defaultRequest = Promise.promisifyAll(request.defaults(requestConfigObj))

export default class MobileLogin {
  constructor (options) {
    assert(options.email, 'Email is required')
    assert(options.password, 'Password is required')
    assert(options.secret, 'Secret is required')
    assert(options.platform, 'Platform is required')
    assert(options.tfCodeHandler, 'tfCodeHandler is required')

    const defaultOptions = {
      gameSku: getGameSku(options.platform),
      platform: getPlatform(options.platform)
    }

    this.options = {}
    Object.assign(this.options, defaultOptions, options)
  }

  async login () {
    let response = await this.getLogin()
    await this.postLogin(response.request.href)
    // console.log(response.body)
  }

  async getLogin () {
    const machineKey = await generateMachineKey()
    const url = 'https://accounts.ea.com/connect/auth?client_id=FIFA-16-MOBILE-COMPANION&response_type=code&display=web2/login&scope=basic.identity+offline+signin&locale=en_US&prompt=login&machineProfileKey=' + machineKey
    console.log(url)
    const response = await defaultRequest.getAsync(url)

    const title = getTitle(response)
    if (title !== 'Log In') {
      throw new Error(`Unknown response at 'getLogin' title was: ${title}`)
    }
    return response
  }

  async postLogin (url) {
    console.log(56, url)
    const form = {
      email: this.options.email,
      password: this.options.password,
      country: 'HU',
      phoneNumber: '',
      passwordForPhone: '',
      _rememberMe: 'on',
      rememberMe: 'on',
      _eventId: 'submit',
      gCaptchaResponse: '',
      isPhoneNumberLogin: false,
      isIncompletePhone: ''
    }
    const response = await defaultRequest.postAsync(url, {form})
    const title = getTitle(response)

    if (title === 'Log In') throw new Error('Unable to login. Wrong email or password ?')
    if (!response.body.includes('redirectUri')) {
      console.log(response.statusCode, response.body)
      throw new Error(`Unknow response at 'postLogin' title was: ${title}`)
    }
    console.log(response.body)
    return this.postLoginRedirect(response)
  }

  async postLoginRedirect (prevResponse) {
    const urlRegex = new RegExp("var redirectUri = '(.*)'")
    const qsRegex = /redirectUri = redirectUri \+ "(.*)";/
    let nextUrl
    try {
      nextUrl = urlRegex.exec(prevResponse.body)[1]
      nextUrl += qsRegex.exec(prevResponse.body)[1]
    } catch (e) {
      throw new Error(`RegExp failed at 'postLogin' body was: ${prevResponse.body}`)
    }

    const response = await defaultRequest.getAsync(nextUrl)
    const title = getTitle(response)
    if (title === 'Login Verification') return this.handleTwoFactorCode(response.request.href)
    throw Error(`Unknow response at 'postLoginRedirect' title was: ${title}`)
  }

  async handleTwoFactorCode (url) {
    const tfCode = await this.options.tfCodeHandler()
    const form = {
      twofactorCode: tfCode,
      trustThisDevice: 'on',
      _eventId: 'submit'
    }
    const response = await defaultRequest.postAsync(url, {form})
    const title = getTitle(response)

    if (title === 'Set Up an App Authenticator') return this.cancelLoginVerificationUpdate(response.request.href)

    if (title === 'Login Verification') throw new Error('Wrong two factor code.')

    throw Error(`Unknow response at 'handleTwoFactorCode' title was: ${title}`)
  }

  async cancelLoginVerificationUpdate (url) {
    let code
    await defaultRequest.postAsync(url, {
      form: {
        '_eventId': 'cancel',
        'appDevice': 'IPHONE'
      },
      followRedirect: (response) => {
        console.log(126, response.headers)
        if (response.headers.location.includes('code=')) {
          try {
            code = urlModule.parse(response.headers.location, true).query.code
          } catch (e) {
            throw new Error(`Couldn't parse code from headers at 'cancelLoginVerificationUpdate' original error: ${e.message}`)
          }
          return false
        }
        return true
      }
    })
    return this.wtfLogin(code)
  }

  async wtfLogin (code) {
    console.log(137, code)
    const postUrl = `https://accounts.ea.com/connect/token?grant_type=authorization_code&code=${code}&client_id=FIFA-16-MOBILE-COMPANION&client_secret=KrEoFK9ssvXKRWnTMgAu1OAMn7Y37ueUh1Vy7dIk2earFDUDABCvZuNIidYxxNbhwbj3y8pq6pSf8zBW`
    let response = await defaultRequest.postAsync(postUrl, {json: true, headers: {'content-type': 'application/x-www-form-urlencoded'}})
    let token = response.body.access_token
    assert(token, 'Failed to get access token at `wtfLogin`')

    // this stuff seems useless but let's just do it
    const url1 = `https://signin.ea.com/p/mobile/fifa/companion/code?code=${code}`
    let uselessResp = await defaultRequest.getAsync(url1)
    console.log(157, uselessResp.body)

    await this.getNucleus(token)
    await this.getSid(token)
    // await this.getShards()
    // console.log(this)
  }

  async getNucleus (token) {
    const url = 'https://gateway.ea.com/proxy/identity/pids/me'
    console.log(167, jar)
    const response = await defaultRequest.getAsync(url, {json: true, headers: {Authorization: `Bearer ${token}`}})
    console.log(169, response.body)
    this.nucleus = response.body.externalRefValue
  }

  async getShards () {
    // https://utas.mob.v5.fut.ea.com/ut/shards/v2?_=1474137502721
    const timestamp = new Date().getTime()
    const url = `https://utas.mob.v5.fut.ea.com/ut/shards/v2?_=${timestamp}`
    const {body} = await defaultRequest.getAsync(url, {
      headers: {
        'Easw-Session-Data-Nucleus-Id': this.nucleus
      }
    })
    const shard = _.find(body.shardInfo, (shard) => {
      return shard.skus.includes(this.options.gameSku)
    })
    this.apiUrl = shard.clientFacingIpPort
  }

  async getSid (token) {
    const form = {
      isReadOnly: true,
      sku: 'FUT16IOS',
      clientVersion: 20,
      locale: 'en-US',
      method: 'authcode',
      priorityLevel: 4,
      identification: {
        authCode: token,
        redirectUrl: 'nucleus:rest'
      }
    }
    // 1474229595686
    const timestamp = new Date().getTime()
    const url = `https://pas.mob.v5.easfc.ea.com:8095/pow/auth?timestamp=${timestamp}`
    const {body} = await defaultRequest.postAsync(url, {form})
    console.log(206, body)
    this.sid = body.sid
  }
}

function getTitle (response) {
  const $ = cheerio.load(response.body)
  const title = $('title').text()
  return title
}

// example EEA58055-E4E8-42E6-B89D-DFFBBD37AF57
async function generateMachineKey () {
  let parts = await Promise.all([
    randomHex(8),
    randomHex(4),
    randomHex(4),
    randomHex(4),
    randomHex(12)
  ])
  return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`
}

async function randomHex (length, uppercase = true) {
  let randomHexStr = await crypto.randomBytesAsync(48)
  randomHexStr = randomHexStr.toString('hex').substring(0, length)
  if (uppercase) randomHexStr = randomHexStr.toUpperCase()
  return randomHexStr
}

function getGameSku (platform) {
  switch (platform) {
    case 'pc':
      return 'FFA16PCC'
    case 'ps3':
      return 'FFA16PS3'
    case 'ps4':
      return 'FFA16PS4'
    case 'x360':
      return 'FFA16XBX'
    case 'xone':
      return 'FFA16XBO'
  }

  return null
}

function getPlatform (platform) {
  switch (platform) {
    case 'pc':
      return 'pc'
    case 'ps3':
    case 'ps4':
      return 'ps3'
    case 'x360':
    case 'xone':
      return '360'
  }
  return null
}
