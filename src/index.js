'use strict'

import Promise from 'bluebird'
import assert from 'assert'
import utils from './lib/utils'
import Login from './lib/login'
import _ from 'underscore'
import methods from './lib/methods'

const login = Promise.promisifyAll(new Login())

let Fut = class Fut {
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
   * @return {[type]}                         [description]
   */
  constructor (options) {
    assert(options.email, 'Email is required')
    assert(options.password, 'Password is required')
    assert(options.secret, 'Secret is required')
    assert(options.platform, 'Platform is required')
    this.options = {}
    Object.assign(this.options, options)
  }

  async loadVariable (key) {
    if (!this.options.loadVariable) return null
    return this.loadVariable(key)
  }

  async saveVariable (key, val) {
    if (!this.options.saveVariable) return null
    return this.saveVariable(key, val)
  }

  async init () {
    let cookie = await this.loadVariable('cookie')
    if (cookie) {
      login.setCookieJarJSON(cookie)
    }
  }

  async login () {
    let loginResponse = await login.loginAsync(this.email, this.password, this.secret, this.platform, this.tfCodeCb, this.captchaCb)
    await this.saveVariable('cookie', login.getCookieJarJSON())
    this.rawApi = Promise.promisifyAll(loginResponse.apiRequest)
  }

  async sendRequest (url, options) {
    var defaultOptions = {
      xHttpMethod: 'GET',
      headers: {}
    }

    options = _.extend(defaultOptions, options)

    options.headers['X-HTTP-Method-Override'] = options.xHttpMethod
    delete options.xHttpMethod

    let {response, body} = await this.rawApi.post(url, options)

    if (response.statusCode === 401) throw new Error(response.statusMessage)
    if (response.statusCode === 404) throw new Error(response.statusMessage)

    if (utils.isApiError(body)) {
      body.request = {url, options: options}
      let err = new Error(JSON.stringify(body))
      err.futApiStatusCode = Number(body.code)
      throw err
    }
    return body
  }
}

Object.assign(Fut.prototype, methods)
export default Fut

// futapi.isPriceValid = utils.isPriceValid
// futapi.calculateValidPrice = utils.calculateValidPrice
// futapi.calculateNextLowerPrice = utils.calculateNextLowerPrice
// futapi.calculateNextHigherPrice = utils.calculateNextHigherPrice
// futapi.getBaseId = utils.getBaseId
// module.exports = futapi
