require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)
WEB3.eth.transactionConfirmationBlocks = 1
WEB3.transactionConfirmationBlocks = 1
// const AXIOS = require('axios')
// const BASE_URL = `http://${process.env.GETH_IP_ADDRESS}:${process.env.PORT}`
// const REGISTER_UTILS = require('./register.js')
const USER_UTILS = require('./user.js')

describe('Unregister tests', function () {
  it('Should allow an end user to unregister', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const unregisterUserResponse = await USER_UTILS.unregisterUser(accounts[2])
    unregisterUserResponse.events.should.have.property('UserUnregistered')
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })
})
