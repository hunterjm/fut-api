'use strict'

module.exports = {
  isApiError: function (body) {
    if (body && body.code) return true
    return false
  },
  // TODO: what is this ? I don't think it's working
  isApiMessage: function (data) {
    var res = (data && data.debug && data.string && data.code && data.reason)
    if (res) return true
    return false
  },
  format: function (pattern, values) {
    for (var i = 0; i < values.length; i++) {
      pattern = pattern.replace('{' + i + '}', values[i])
    }
    return pattern
  },
  isPriceValid: function (coins) {
    if (coins < 150) return false
    if (coins < 1000) return (coins % 50) === 0
    if (coins < 10000) return (coins % 100) === 0
    if (coins < 50000) return (coins % 250) === 0
    if (coins < 100000) return (coins % 500) === 0
    return (coins % 1000) === 0
  },
  calculateValidPrice: function (coins) {
    if (coins < 150) return 150
    if (coins < 1000) return coins - (coins % 50)
    if (coins < 10000) return coins - (coins % 100)
    if (coins < 50000) return coins - (coins % 250)
    if (coins < 100000) return coins - (coins % 500)
    return coins - (coins % 1000)
  },
  calculateNextLowerPrice: function (coins) {
    coins = this.calculateValidPrice(coins)
    if (coins <= 150) return 150
    if (coins <= 1000) return coins - 50
    if (coins <= 10000) return coins - 100
    if (coins <= 50000) return coins - 250
    if (coins <= 100000) return coins - 500
    return coins - 1000
  },
  calculateNextHigherPrice: function (coins) {
    coins = this.calculateValidPrice(coins)
    if (coins >= 100000) return coins + 1000
    if (coins >= 50000) return coins + 500
    if (coins >= 10000) return coins + 250
    if (coins >= 1000) return coins + 100
    return coins + 50
  },
  getBaseId: function (resourceId, returnVersion = false) {
    // Calculate base id and version from a resource id.
    var baseId = resourceId + 0xC4000000 // 3288334336
    var version = 0

    while (baseId > 0x01000000) {  // 16777216
      version++
      switch (version) {
        case 1:
          baseId -= 0x80000000  // 2147483648
          break
        case 2:
          baseId -= 0x03000000  // 50331648
          break
        default:
          baseId -= 0x01000000  // 16777216
          break
      }
    }

    if (returnVersion) return { baseId: resourceId, version: version }
    return resourceId
  }
}
