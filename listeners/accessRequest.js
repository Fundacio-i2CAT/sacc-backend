const REQUEST = require('../business/accessRequest.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WSPROVIDER = new WEB3_API.providers.WebsocketProvider(process.env.INFURA_WSS, { headers: { Origin: 'test' } })
const WEB3 = new WEB3_API(WSPROVIDER)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)

module.exports = function () {
  CONTRACT.events.GrantedAccessToInstitution(
    { fromBlock: 0 },
    async (error, event) => {
      if (error) {
        // console.log(error)
      }
      if (!event) {
        return
      }
      const institutionAddress = event.returnValues.institutionRequester
      const projectAddress = event.returnValues.project
      const userAddress = event.returnValues.userRequested
      try {
        await REQUEST.grantAccessRequest(
          userAddress.toLowerCase(),
          institutionAddress.toLowerCase(),
          projectAddress
        )
      } catch (error) {
        console.log('Expired grant')
      }
    }
  )

  CONTRACT.events.RevokedAccessToInstitution(
    { fromBlock: 0 },
    async (error, event) => {
      if (error) {
        // console.log(error)
      }
      if (!event) {
        return
      }
      const institutionAddress = event.returnValues.institutionRequester
      const projectAddress = event.returnValues.project
      const userAddress = event.returnValues.userRequested
      try {
        await REQUEST.revokeAccessRequest(
          userAddress.toLowerCase(),
          institutionAddress.toLowerCase(),
          projectAddress
        )
      } catch (error) {
        console.log('Expired revoke')
      }
    }
  )
}
