const USER = require('../business/user.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WSPROVIDER = new WEB3_API.providers.WebsocketProvider(process.env.INFURA_WSS, { headers: { Origin: 'test' } })
const WEB3 = new WEB3_API(WSPROVIDER)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)

module.exports = function () {
  CONTRACT.events.UserUnregistered(
    { fromBlock: 0 },
    async (error, event) => {
      if (error) {
        // console.log(error)
      }
      if (!event) {
        return
      }
      await USER.unregisterUser(event.returnValues.endUser)
    }
  )
}
