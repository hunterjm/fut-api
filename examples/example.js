'use strict'

const readline = require('readline')
const Fut = require('fut')
const Promise = require('bluebird')
const co = require('co')
const storage = require('node-persist')
storage.initSync()

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const email = process.env.EMAIL
const password = process.env.PASSWORD
const platform = process.env.PLATFORM
const secret = process.env.SECRET

var fut = new Fut({
  email,
  password,
  secret,
  platform
  loginType: 'web'
  captchaHandler: (captcha, resolve) => {
    co(function * () {
      yield fs.writeFileAsync('captcha.jpg', captcha)
      // Do something with the captcha file
      resolve(captchaRes.text)
    })
  },
  tfAuthHandler: (send) => {
    return new Promise((resolve, reject) => {
      rl.question('Enter your two factor code:', function (code) {
        return resolve(code)
      })
    })
  },
  saveVariable: (key, val) => {
    console.log('setting item', key)
    storage.setItem(key, val)
  },
  loadVariable: co.wrap(function * (key) {
    var item = storage.getItem(key)
    return item
  })
})

co(function * () {
  yield fut.login()
  let resp = yield fut.getCredits()
  console.log(resp)
}).catch((e) => console.log(e.stack))
