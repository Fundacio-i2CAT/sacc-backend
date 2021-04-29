const REQUEST = require('../business/registerRequest.js')
const USER = require('../business/user.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WSPROVIDER = new WEB3_API.providers.WebsocketProvider(process.env.INFURA_WSS, { headers: { Origin: 'test' } })
const WEB3 = new WEB3_API(WSPROVIDER)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)
const FCM_NODE = require('fcm-node')
const FCM = new FCM_NODE(process.env.FCM_SERVER_KEY)
const NOTIFICATION = JSON.parse(FS.readFileSync('./listeners/notification.json', 'utf-8'))
const DEVELOPMENT = process.env.DEVELOPMENT

module.exports = function (merkleTree) {
  CONTRACT.events.GrantedAccessUser({ fromBlock: 0 }, async (error, event) => {
    if (error) {
      console.log(error)
    }
    if (!event) {
      return
    }
    const userRequester = event.returnValues.userRequester
    const roleRequested = event.returnValues.roleRequested
    let roleRequestedString
    switch (roleRequested) {
      case 1:
        roleRequestedString = 'END_USER'
        break
      case 4:
        roleRequestedString = 'RESEARCH_INSTITUTION_MANAGER'
        break
      case 3:
        roleRequestedString = 'LICENSE_MANAGER'
        break
    } try {
      const registerRequest = await REQUEST.getRegisterRequest(
        userRequester.toLowerCase()
      )
      if (registerRequest !== null) {
        await USER.createUser(
          userRequester.toLowerCase(),
          registerRequest.firstName,
          registerRequest.surnames,
          registerRequest.phone,
          registerRequest.email,
          registerRequest.institutionName,
          registerRequest.cardId,
          roleRequestedString,
          registerRequest.dataUrl,
          registerRequest.firebaseCloudToken
        )
        if (roleRequestedString === 'END_USER') {
          try {
            await merkleTree.insert(
              BigInt(userRequester.toLowerCase()), BigInt(userRequester.toLowerCase()))
          } catch (err) {
            console.log('Key already exists in Merkle tree')
          }
        }
        if (!registerRequest.firebaseCloudToken) {
          return
        }
        if (!DEVELOPMENT) {
          const message = {
            to: registerRequest.firebaseCloudToken,
            notification: NOTIFICATION.notification
          }
          FCM.send(message, function (err, response) {
            if (err) {
              console.log(err)
            }
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  })
}
