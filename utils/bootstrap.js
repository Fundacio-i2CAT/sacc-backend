require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const CHANCE_API = require('chance')
const CHANCE = new CHANCE_API()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)

const USER_UTILS = require('./../tests/user.js')
const REGISTER_UTILS = require('./../tests/register.js')

const getUsers = async (n) => {
  const accounts = await WEB3.eth.getAccounts()
  const users = []
  for (let i = 0; i < n; i++) {
    let role = 'END_USER'
    let cardId = await CHANCE.ssn()
    let institutionName = null
    if (Math.floor(Math.random() * 10) < 5) {
      role = 'RESEARCH_INSTITUTION_MANAGER'
      institutionName = await CHANCE.address()
      cardId = null
    }
    users.push({
      address: accounts[i],
      firstName: await CHANCE.first(),
      surnames: await CHANCE.name(),
      phone: await CHANCE.phone(),
      email: await CHANCE.email(),
      institutionName: institutionName,
      cardId: cardId,
      role: role
    })
  }
  return users
}

const bootstrap = async (n) => {
  const users = await getUsers(n)
  const accounts = await WEB3.eth.getAccounts()
  for (let i = 0; i < n; i++) {
    const user = users[i]
    if (!accounts[2 + i]) {
      continue
    }
    if (Math.floor(Math.random() * 10) < 5) {
      console.log(`Registering request and creating user: ${accounts[2 + i]} (${user.firstName} ${user.surnames})`)
      await USER_UTILS.newUser(
        accounts[1],
        accounts[2 + i], user.firstName, user.surnames,
        user.phone, user.email, user.institutionName, user.cardId, user.role)
    } else {
      console.log(`Registering request for user:          ${accounts[2 + i]} (${user.firstName} ${user.surnames})`)
      REGISTER_UTILS.registerRequest(
        accounts[2 + i], user.firstName, user.surnames,
        user.phone, user.email, user.institutionName, user.cardId, user.role)
    }
  }
}

bootstrap(20)
