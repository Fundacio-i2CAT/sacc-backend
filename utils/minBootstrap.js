require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const CHANCE_API = require('chance')
const CHANCE = new CHANCE_API()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)

const USER_UTILS = require('./../tests/user.js')

const getUsers = async () => {
  const accounts = await WEB3.eth.getAccounts()
  const users = []
  const patientRole = 'PATIENT'
  const cardId = await CHANCE.ssn()
  const riManagerRole = 'RESEARCH_INSTITUTION_MANAGER'
  const institutionName = await CHANCE.address()
  users.push({
    address: accounts[2],
    firstName: await CHANCE.first(),
    surnames: await CHANCE.name(),
    phone: await CHANCE.phone(),
    email: await CHANCE.email(),
    institutionName: null,
    cardId: cardId,
    role: patientRole
  })
  users.push({
    address: accounts[3],
    firstName: await CHANCE.first(),
    surnames: await CHANCE.name(),
    phone: await CHANCE.phone(),
    email: await CHANCE.email(),
    institutionName: institutionName,
    cardId: null,
    role: riManagerRole
  })
  return users
}

const bootstrap = async () => {
  const users = await getUsers()
  const accounts = await WEB3.eth.getAccounts()
  for (let i = 0; i < 2; i++) {
    const user = users[i]
    console.log(`Registering request and creating user: ${accounts[2 + i]} (${user.firstName} ${user.surnames})`)
    await USER_UTILS.newUser(
      accounts[1],
      accounts[2 + i], user.firstName, user.surnames,
      user.phone, user.email, user.institutionName, user.cardId, user.role)
  }
}

bootstrap()
