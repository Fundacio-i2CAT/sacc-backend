module.exports = function (merkleTree) {
  const accessRequestListeners = require('./accessRequest')
  accessRequestListeners()
  const registerRequestListeners = require('./registerRequest')
  registerRequestListeners(merkleTree)
  const unregisterRequestListeners = require('./userUnregistered')
  unregisterRequestListeners()
  // const etherReceivedListeners = require('./etherReceived')
  // etherReceivedListeners()
}
