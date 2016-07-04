'use strict'

import Promise from 'bluebird'
import assert from 'assert'
import utils from './lib/utils'
import Login from './lib/login'
import _ from 'underscore'
import Methods from './lib/methods'
import moment from 'moment'
import request from 'request'

const login = Promise.promisifyAll(new Login())

let Fut = class Fut extends Methods {
  /**
   * [constructor description]
   * @param  {[type]}  options.email          [description]
   * @param  {[type]}  options.password       [description]
   * @param  {[type]}  options.secret         [description]
   * @param  {[type]}  options.platform       [description]
   * @param  {[type]}  options.captchaHandler [description]
   * @param  {[type]}  options.tfAuthHandler  [description]
   * @param  {Boolean} options.saveVariable   [description]
   * @param  {Boolean} options.loadVariable   [description]
   * @param  {Number}  options.RPM            [description]
   * @param  {Number}  options.minDelay       [description]
   * @param  {[String]} options.proxy       [description]
   * @return {[type]}                         [description]
   */
  constructor (options) {
    super()
    assert(options.email, 'Email is required')
    assert(options.password, 'Password is required')
    assert(options.secret, 'Secret is required')
    assert(options.platform, 'Platform is required')

    let defaultOptions = {
      RPM: 0,
      minDelay: 0
    }

    this.options = {}
    this.isReady = false // instance will be ready after we called _init func
    Object.assign(this.options, defaultOptions, options)
  }

  async loadVariable (key) {
    if (!this.options.loadVariable) return null
    return this.options.loadVariable(key)
  }

  async saveVariable (key, val) {
    if (!this.options.saveVariable) return null
    return this.options.saveVariable(key, val)
  }

  async _init () {
    let cookie = await this.loadVariable('cookie')
    if (cookie) {
      login.setCookieJarJSON(cookie)
    }

    let minuteLimitStartedAt = await this.loadVariable('minuteLimitStartedAt')
    this.minuteLimitStartedAt = minuteLimitStartedAt || moment()
  }

  async login () {
    await this._init()
    let loginResponse = await login.loginAsync(this.options.email, this.options.password, this.options.secret, this.options.platform, this.options.tfAuthHandler, this.options.captchaHandler)
    await this.saveVariable('cookie', login.getCookieJarJSON())
    this.rawApi = Promise.promisify(loginResponse.apiRequest, loginResponse)

    // init proxy
    if (this.options.proxy) {
      this.rawApi.defaults({proxy: this.options.proxy})
    }

    let loginDefaults = _.omit(login.getLoginDefaults(), 'jar')
    console.log('login defaults', loginDefaults)
    await this.saveVariable('loginDefaults', loginDefaults)
    this.isReady = true
  }

  async loginCached () {
    let loginDefaults = await this.loadVariable('loginDefaults')
    if (!loginDefaults) {
      throw new Error('Login defaults are not saved. Use classic login first!')
    }
    let rawApi = request.defaults(loginDefaults)
    if (this.options.proxy) {
      rawApi.defaults({proxy: this.options.proxy})
    }
    this.rawApi = Promise.promisify(rawApi)
    this.isReady = true
  }

  async api (url, options) {
    if (!this.isReady) throw new Error('Fut instance is not ready yet, run login first!')

    // limit handler
    await this._limitHandler()

    var defaultOptions = {
      xHttpMethod: 'GET',
      headers: {}
    }

    options = _.extend(defaultOptions, options)
    options.url = url
    options.method = 'POST'

    options.headers['X-HTTP-Method-Override'] = options.xHttpMethod
    delete options.xHttpMethod

    const {statusCode, statusMessage, body} = await this.rawApi(options)

    if (statusCode.toString()[0] !== '2') {
      throw new Error(`FUT api http error: ${statusCode} ${statusMessage}`)
    }

    if (utils.isApiError(body)) {
      body.request = {url, options: options}
      let err = new Error(`Fut api error: ${JSON.stringify(body)}`)
      err.futApiStatusCode = Number(body.code)
      throw err
    }
    return body
  }

  async _limitHandler () {
    // seconds
    let sinceLastRequest = moment().diff(this.lastRequestAt)
    if (sinceLastRequest < this.options.minDelay) {
      console.log('Waiting on second limit ...')
      await Promise.delay(this.options.minDelay - sinceLastRequest)
    }

    // minutes
    if (moment().diff(this.minuteLimitStartedAt, 'minutes') >= 1 || !this.minuteLimitStartedAt) {
      this.minuteLimitStartedAt = moment()
      this.requestsThisMinute = 0
    } else {
      this.requestsThisMinute++
    }

    if ((this.requestsThisMinute >= this.options.RPM) && this.options.RPM !== 0) {
      let resetsAt = this.minuteLimitStartedAt.add(1, 'minute')
      let needsToReset = resetsAt.diff(moment())
      console.log(`Waiting on RPM ... ${needsToReset}`)
      await Promise.delay(needsToReset)
    }

    // TODO: continue this
    this.lastRequestAt = moment()
  }
}

// Object.assign(Fut.prototype, Methods.prototype)
module.exports = Fut

// futapi.isPriceValid = utils.isPriceValid
// futapi.calculateValidPrice = utils.calculateValidPrice
// futapi.calculateNextLowerPrice = utils.calculateNextLowerPrice
// futapi.calculateNextHigherPrice = utils.calculateNextHigherPrice
// futapi.getBaseId = utils.getBaseId
// module.exports = futapi
