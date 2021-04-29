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
const FORM_DATA = require('form-data')
const FS = require('fs')

describe('User tests', function () {
  it('Should allow an admin to onboard a user with a pending register request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should deny a non admin user to onboard a user with a pending register request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    try {
      await USER_UTILS.newUser(
        accounts[5], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    } catch (error) {
      await REGISTER_UTILS.deleteRequest(accounts[2], accounts[2])
      error.message.should.be.a('string')
    }
  })

  it('Should avoid a non admin user to delete a user', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    try {
      await USER_UTILS.deleteUser(accounts[5], accounts[2])
    } catch (error) {
      const deleteUserResponseOK = await USER_UTILS.deleteUser(accounts[1], accounts[2])
      error.message.should.be.a('string')
      deleteUserResponseOK.status.should.equal(200)
    }
  })

  it('Should allow an admin to get user data', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[1], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const userUrl = `${BASE_URL}/user`
    const getUserResponse = await AXIOS.get(userUrl, axiosConfig)
    getUserResponse.status.should.equal(200)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should allow an onboarded user to get her/his own data', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[2], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const userUrl = `${BASE_URL}/user`
    const getUserResponse = await AXIOS.get(userUrl, axiosConfig)
    getUserResponse.status.should.equal(200)
    getUserResponse.data.address.should.equal(accounts[2].toLowerCase())
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should avoid any other user to get another user data', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[3], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const userUrl = `${BASE_URL}/user`
    try {
      await AXIOS.get(userUrl, axiosConfig)
    } catch (error) {
      error.response.status.should.equal(403)
    }
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should allow a License Administrator to get endUser count', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse1.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Fairy', 'Adams', '5555555', 'adams@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const newUserResponse3 = await USER_UTILS.newUser(
      accounts[1], accounts[4], 'Mickey', 'Mouse', '5555555', 'mickey@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse3.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], accounts[5], 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[5], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const endUserCountUrl = `${BASE_URL}/endUserCount`
    const getEndUserCountResponse = await AXIOS.get(endUserCountUrl, axiosConfig)
    getEndUserCountResponse.status.should.equal(200)
    getEndUserCountResponse.data.should.have.property('endUserCount')
    getEndUserCountResponse.data.endUserCount.should.be.a('number')
    getEndUserCountResponse.data.endUserCount.should.equal(5)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse1.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
    const deleteUserResponse3 = await USER_UTILS.deleteUser(accounts[1], accounts[4])
    deleteUserResponse3.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], accounts[5])
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should avoid a EndUser to get endUser count', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse1.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Fairy', 'Adams', '5555555', 'adams@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const newUserResponse3 = await USER_UTILS.newUser(
      accounts[1], accounts[4], 'Mickey', 'Mouse', '5555555', 'mickey@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse3.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], accounts[5], 'Fake Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'END_USER', 'http://example.com')
    researchInstitutionManagerResponse.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[5], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
    const endUserCountUrl = `${BASE_URL}/endUserCount`
    try {
      await AXIOS.get(endUserCountUrl, axiosConfig)
    } catch (error) {
      error.response.status.should.equal(403)
    }
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse1.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
    const deleteUserResponse3 = await USER_UTILS.deleteUser(accounts[1], accounts[4])
    deleteUserResponse3.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], accounts[5])
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow an onboarded user to update profile data', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse.status.should.equal(200)
    const putUserResponse1 = await USER_UTILS.updateUser(accounts[2], { firstName: 'Roger' })
    putUserResponse1.data.firstName.should.equal('Roger')
    const putUserResponse2 = await USER_UTILS.updateUser(accounts[2], { surnames: 'Rabbit' })
    putUserResponse2.data.firstName.should.equal('Roger')
    putUserResponse2.data.surnames.should.equal('Rabbit')
    const putUserResponse3 = await USER_UTILS.updateUser(accounts[2], { cardId: '666' })
    putUserResponse3.data.firstName.should.equal('Roger')
    putUserResponse3.data.surnames.should.equal('Rabbit')
    putUserResponse3.data.cardId.should.equal('666')
    const putUserResponse4 = await USER_UTILS.updateUser(accounts[2], { phone: '555-75765' })
    putUserResponse4.data.firstName.should.equal('Roger')
    putUserResponse4.data.surnames.should.equal('Rabbit')
    putUserResponse4.data.cardId.should.equal('666')
    putUserResponse4.data.phone.should.equal('555-75765')
    const putUserResponse5 = await USER_UTILS.updateUser(accounts[2], { dataUrl: 'http://i2cat.net' })
    putUserResponse5.data.firstName.should.equal('Roger')
    putUserResponse5.data.surnames.should.equal('Rabbit')
    putUserResponse5.data.cardId.should.equal('666')
    putUserResponse5.data.phone.should.equal('555-75765')
    putUserResponse5.data.dataUrl.should.equal('http://i2cat.net')
    const putUserResponse6 = await USER_UTILS.updateUser(accounts[2], { firebaseCloudToken: 'sample' })
    putUserResponse6.data.firstName.should.equal('Roger')
    putUserResponse6.data.surnames.should.equal('Rabbit')
    putUserResponse6.data.cardId.should.equal('666')
    putUserResponse6.data.phone.should.equal('555-75765')
    putUserResponse6.data.dataUrl.should.equal('http://i2cat.net')
    putUserResponse6.data.firebaseCloudToken.should.equal('sample')
    try {
      await USER_UTILS.updateUser(accounts[2], { email: 'invalid' })
    } catch (error) {
      error.response.status.should.equal(400)
    }
    const putUserResponse7 = await USER_UTILS.updateUser(accounts[2], { asleep: true })
    putUserResponse7.data.firstName.should.equal('Roger')
    putUserResponse7.data.surnames.should.equal('Rabbit')
    putUserResponse7.data.cardId.should.equal('666')
    putUserResponse7.data.phone.should.equal('555-75765')
    putUserResponse7.data.dataUrl.should.equal('http://i2cat.net')
    putUserResponse7.data.asleep.should.equal(true)
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
  })

  it('Should allow an onboarded user to post files', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Sponge2', 'Bob2', '5555555', 'bob2@example.com', null, '1212', 'RESEARCH_INSTITUTION_MANAGER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse2.status.should.equal(200)
    const data = new FORM_DATA()
    const buffer = FS.readFileSync('./public/TopicsProof.wasm')
    data.append('file', buffer, 'sample.file')
    const uploadUrl = `${BASE_URL}/upload`
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[2], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    AXIOS.post(uploadUrl, data, {
      headers: {
        accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.8',
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        Authorization: 'Bearer ' + token
      }
    })
    const { token2 } = await REGISTER_UTILS.simulateLogin(accounts[3], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const fileResponse = await AXIOS.get(`${BASE_URL}/data/sample.file`, { headers: { Authorization: 'Bearer ' + token2 } })
    const type = typeof fileResponse
    type.should.equal('object')
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
  })
})
