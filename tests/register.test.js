require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const WEB3_API = require('web3')
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null)
const AXIOS = require('axios')
const BASE_URL = `http://${process.env.GETH_IP_ADDRESS}:${process.env.PORT}`
const FS = require('fs')

const REGISTER_UTILS = require('./register.js')

describe('Register request related tests', function () {
  it('Should deny access with bad signed token', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[0]
    try {
      const badTokenResponse = await REGISTER_UTILS.simulateLogin(accounts[0], 'Bad Secret', 3600)
      const registerUrl = `${BASE_URL}/registerRequest`
      const request = { address: address, name: 'Albert Einstein', phone: '555 666 555', email: 'albert@example.com', role: 'END_USER' }
      const axiosConfig = { headers: { Authorization: 'Bearer ' + badTokenResponse.token } }
      await AXIOS.post(registerUrl, request, axiosConfig)
    } catch (error) {
      error.response.status.should.equal(401)
    }
  })

  it('Should allow a user to request register', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[3]
    const response = await REGISTER_UTILS.registerRequest(
      address, 'John', 'Doe', '555 555 555', 'jon@example.com', null, '787878H', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    const getResponse = await REGISTER_UTILS.getRegisterRequests(accounts[1])
    getResponse.status.should.equal(200)
    const delResponse = await REGISTER_UTILS.deleteRequest(accounts[3], accounts[3])
    delResponse.status.should.equal(200)
  })

  it('Should fail using not valid email address', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[3]
    try {
      await REGISTER_UTILS.registerRequest(
        address, 'John', 'Doe', '555 555 555', 'jon', null, '787878H', 'END_USER', 'http://example.com')
    } catch (error) {
      error.response.status.should.equal(400)
    }
  })

  it('Should prevent a different user to delete a register request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[6]
    const response = await REGISTER_UTILS.registerRequest(
      address, 'John', 'Doe', '555 555 555', 'jon@example.com', null, '898989H', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    try {
      await REGISTER_UTILS.deleteRequest(accounts[4], accounts[6])
    } catch (error) {
      error.response.status.should.equal(401)
    }
    const delResponseOK = await REGISTER_UTILS.deleteRequest(accounts[6], accounts[6])
    delResponseOK.status.should.equal(200)
  })

  it('Should allow a license manager to delete a register request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[3]
    const response = await REGISTER_UTILS.registerRequest(
      address, 'John', 'Doe', '555 555 555', 'jon@example.com', null, '898989H', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    const deleteResponse = await REGISTER_UTILS.deleteRequest(accounts[1], accounts[3])
    deleteResponse.status.should.equal(200)
  })

  it('Should avoid a user to post a second register request while there\'s another pending', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[0]
    const response = await REGISTER_UTILS.registerRequest(
      address, 'John', 'Doe', '555 555 555', 'jon@example.com', null, '989898J', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    try {
      await REGISTER_UTILS.registerRequest(
        address, 'John', 'D0e', '555 556 555', 'jon2@example.com', 'Medical-I', null, 'RESEARCH_INSTITUTION_MANAGER')
    } catch (error) {
      error.response.status.should.equal(409)
    }
    const delResponseOK = await REGISTER_UTILS.deleteRequest(accounts[0], accounts[0])
    delResponseOK.status.should.equal(200)
  })

  it('Should avoid a user to  post a register request using a non supported role', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const address = accounts[0]
    try {
      await REGISTER_UTILS.registerRequest(
        address, 'John', 'Doe', '555 555 555', 'jon@example.com', 'Medical-I', null, 'ROCKSTAR')
    } catch (error) {
      error.response.status.should.equal(400)
    }
  })

  it('Should test smart contract integration', async () => {
    const abi = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
    const contract = new WEB3.eth.Contract(abi, process.env.CONTRACT_ADDRESS)
    const accounts = await WEB3.eth.getAccounts()
    const ownerRole = await contract.methods.userRoles(accounts[0]).call()
    ownerRole.should.equal(0)
    const adminRole = await contract.methods.userRoles(accounts[1]).call()
    adminRole.should.equal(3)
  })

  it('Should test getRegisterRequest endpoint using admin address', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const response = await REGISTER_UTILS.registerRequest(
      accounts[4], 'John', 'Doe', '555 555 555', 'jon@example.com', null, '989898J', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[1], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const getUrl = `${BASE_URL}/registerRequest`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const getResponse = await AXIOS.get(getUrl, axiosConfig)
    getResponse.status.should.equal(200)
    const delResponse = await REGISTER_UTILS.deleteRequest(accounts[4], accounts[4])
    delResponse.status.should.equal(200)
  })

  it('Should test getRegisterRequest endpoint using another address', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const response = await REGISTER_UTILS.registerRequest(
      accounts[4], 'John', 'Doe', '555 555 555', 'jon@example.com', null, '989898J', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[8], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const getUrl = `${BASE_URL}/registerRequest`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    try {
      await AXIOS.get(getUrl, axiosConfig)
    } catch (error) {
      error.response.status.should.equal(401)
    }
    const delResponse = await REGISTER_UTILS.deleteRequest(accounts[1], accounts[4])
    delResponse.status.should.equal(200)
  })

  it('Should test getRegisterRequest endpoint using own address', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const response = await REGISTER_UTILS.registerRequest(
      accounts[4], 'John', 'Doe', '555 555 555', 'jon@example.com', null, '989898J', 'END_USER', 'http://example.com')
    response.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[4], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const getUrl = `${BASE_URL}/registerRequest`
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const getResponse = await AXIOS.get(getUrl, axiosConfig)
    getResponse.status.should.equal(200)
    const delResponse = await REGISTER_UTILS.deleteRequest(accounts[1], accounts[4])
    delResponse.status.should.equal(200)
  })
})
