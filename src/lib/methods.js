// @flow weak

const urls = require('./urls')()
import utils from './utils'
import _ from 'underscore'

export default class Methods {
  api: Function;

  getUser = () => this.api(urls.api.userInfo)

  getCredits = () => this.api(urls.api.credits)

  getTradepile = () => this.api(urls.api.tradepile)

  getWatchlist = () => this.api(urls.api.watchlist)

  getPilesize = () => this.api(urls.api.pilesize)

  relist = () => this.api(urls.api.relist, {xHttpMethod: 'PUT'})

  getSquads = () => this.api(urls.api.squadList)

  getSquadDetails = (squadId) => this.api(utils.format(urls.api.squadDetails, [squadId]))

  getUnassigned = () => this.api(urls.api.unassigned)

  search = (filter) => {
    let defaultFilter = {
      type: 'player',
      start: 0,
      num: 16
    }
    filter = _.extend(defaultFilter, filter)
    if (filter.maskedDefId) filter.maskedDefId = utils.getBaseId(filter.maskedDefId)
    let url = urls.api.transfermarket + toUrlParameters(filter)
    return this.api(url)
  }

  placeBid = (tradeId, bid) => {
    let tId = 0
    let body = {bid}
    if (!utils.isPriceValid(bid)) throw new Error('Price is invalid.')

    if (_.isNumber(tradeId)) tId = tradeId
    else if (_.isObject(tradeId) && _.isNumber(tradeId.tradeId)) tId = tradeId.tradeId

    if (tId === 0) throw new Error('0 is not a valid tradeId')

    let url = utils.format(urls.api.placebid, [tId])
    let options = {body, xHttpMethod: 'PUT'}
    return this.api(url, options)
  }

  listItem = (itemDataId, startingBid, buyNowPrice, duration) => {
    if ([3600, 10800, 21600, 43200, 86400, 259200].indexOf(duration) < 0) throw new Error('Duration is invalid.')
    if (!utils.isPriceValid(startingBid) || !utils.isPriceValid(buyNowPrice)) throw new Error('Starting bid or buy now price is invalid.')

    let body = {
      duration,
      buyNowPrice,
      startingBid,
      itemData: {id: itemDataId}
    }
    let options = {body, xHttpMethod: 'POST'}
    return this.api(urls.api.listItem, options)
  }

  getStatus = (tradeIds) => {
    let urlParameters = `tradeIds=${tradeIds.join(',')}`
    let url = urls.api.status + urlParameters
    return this.api(url)
  }

  addToWatchlist = (tradeId) => {
    let body = {'auctionInfo': [{id: tradeId}]}
    let url = urls.api.watchlist + utils.format('?tradeId={0}', [tradeId])
    let options = {body, xHttpMethod: 'PUT'}
    return this.api(url, options)
  }

  removeFromWatchlist = (tradeId) => {
    let url = urls.api.watchlist + utils.format('?tradeId={0}', [tradeId])
    return this.api(url, {xHttpMethod: 'DELETE'})
  }

  removeFromTradepile = (tradeId) => this.api(utils.format(urls.api.removeFromTradepile, [tradeId]), { xHttpMethod: 'DELETE' })

  sendToTradepile = (itemDataId) => {
    let body = {'itemData': [{pile: 'trade', id: itemDataId}]}
    return this.api(urls.api.item, {body, xHttpMethod: 'PUT'})
  }

  sendToClub = (itemDataId) => {
    let body = {'itemData': [{pile: 'club', id: itemDataId}]}
    this.api(urls.api.item, {body, xHttpMethod: 'PUT'})
  }

  quickSell = (itemDataId) => this.api(urls.api.item + utils.format('/{0}', [itemDataId]), { xHttpMethod: 'DELETE' })

  deleteSoldFromTrade = () => this.api(urls.api.sold, {xHttpMethod: 'DELETE'})
}

function toUrlParameters (obj) {
  var str = ''
  var keys = Object.keys(obj)
  for (var i = 0; i < keys.length; i++) {
    str += keys[i] + '=' + encodeURI(obj[keys[i]]).replace(/%5B/g, '[').replace(/%5D/g, ']') + '&'
  }
  return str.substr(0, str.length - 1)
}
