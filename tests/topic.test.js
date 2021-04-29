require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)
WEB3.eth.transactionConfirmationBlocks = 1
WEB3.transactionConfirmationBlocks = 1
const AXIOS = require('axios')
const BASE_URL = `http://${process.env.GETH_IP_ADDRESS}:${process.env.PORT}`
const REGISTER_UTILS = require('./register.js')
const USER_UTILS = require('./user.js')

describe('Topic tests', function () {
  it('Should allow an end user to retrieve topic list', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[2], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const topicsUrl = `${BASE_URL}/topic`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const topicsResponse = await AXIOS.get(topicsUrl, axiosConfig)
    topicsResponse.status.should.equal(200)
    topicsResponse.data.topics.length.should.equal(1)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager to retrieve topic list', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Researcher', 'John', '5555555',
      'john@example.com', null, '1212', 'RESEARCH_INSTITUTION_MANAGER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[3], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const topicsUrl = `${BASE_URL}/topic`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const topicsResponse = await AXIOS.get(topicsUrl, axiosConfig)
    topicsResponse.status.should.equal(200)
    topicsResponse.data.topics.length.should.equal(1)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
  })

  it('Should allow a license manager to retrieve topic list', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[1], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const topicsUrl = `${BASE_URL}/topic`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const topicsResponse = await AXIOS.get(topicsUrl, axiosConfig)
    topicsResponse.status.should.equal(200)
    topicsResponse.data.topics.length.should.equal(1)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should allow an end user to post a topic zk proof', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[7], 'Sponge2', 'Bob2', '5555555', 'bob2@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[2], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const topicsUrl = `${BASE_URL}/topic`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const body = { topicNames: ['Hipertensió'] }
    const topicsResponse = await AXIOS.post(topicsUrl, body, axiosConfig)
    topicsResponse.status.should.equal(200)
    topicsResponse.data.topics.length.should.equal(1)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[7])
    deleteUserResponse2.status.should.equal(200)
  })
})
