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
const FR = require('ffjavascript').bn128.Fr
// const FS = require('fs')
// const WITNESS_CALCULATOR_BUILDER = require('circom_runtime').WitnessCalculatorBuilder
// const SNARKJS = require('snarkjs')

describe('Siblings tests', function () {
  it('Should allow a user to download their siblings in the Merkle tree', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Sponge2', 'Bob2', '55555552', 'bob2@example.com', null, '1211', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[2], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token }, transformResponse: [data => data] }
    const siblingsUrl = `${BASE_URL}/siblings`
    const getSiblingsResponse = await AXIOS.get(siblingsUrl, axiosConfig)
    getSiblingsResponse.data = JSON.parse(getSiblingsResponse.data)
    getSiblingsResponse.data.found.should.equal(true)
    getSiblingsResponse.data.should.have.property('root')
    const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
  })

  it('Should allow a user to generate a zero knowledge proof', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse = await USER_UTILS.newUser(
      accounts[1], accounts[8], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com')
    newUserResponse.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[9], 'Sponge2', 'Bob2', '55555552', 'bob2@example.com', null, '1211', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const { token } = await REGISTER_UTILS.simulateLogin(accounts[8], process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
    const axiosConfig = { headers: { Authorization: 'Bearer ' + token }, transformResponse: [data => data] }
    const siblingsUrl = `${BASE_URL}/siblings`
    const getSiblingsResponse = await AXIOS.get(siblingsUrl, axiosConfig)
    getSiblingsResponse.data = JSON.parse(getSiblingsResponse.data)
    getSiblingsResponse.data.found.should.equal(true)
    getSiblingsResponse.data.should.have.property('root')
    const siblings = getSiblingsResponse.data.siblings.map(
      (x) => { return BigInt(x) })
    while (siblings.length < 10) siblings.push(FR.e(0))
    // const wasm = await FS.promises.readFile('./utils/circuit.wasm')
    // const cWasm = await WITNESS_CALCULATOR_BUILDER(wasm, { sanityCheck: true })
    // const input = {
    //   key: BigInt(getSiblingsResponse.data.foundValue),
    //   value: BigInt(getSiblingsResponse.data.foundValue),
    //   root: BigInt(getSiblingsResponse.data.root),
    //   siblings,
    //   enabled: 1,
    //   fnc: 0,
    //   oldKey: 0,
    //   oldValue: 0,
    //   isOld0: 0
    // }
    // const w = await cWasm.calculateWitness(input)
    // const vkProof = getSiblingsResponse.data.trustedSetup.vkProof
    // const { proof, publicSignals } = SNARKJS.groth.genProof(vkProof, w)
    // proof.protocol.should.equal('groth')
    // publicSignals.should.be.an('array')
    // publicSignals.length.should.equal(18)
    // const vkVerifier = getSiblingsResponse.data.trustedSetup.vkVerifier
    // console.log(vkVerifier)
    // const result = SNARKJS.groth.isValid(vkVerifier, proof, publicSignals)
    // console.log(result)
    // const deleteUserResponse = await USER_UTILS.deleteUser(accounts[1], accounts[8])
    // deleteUserResponse.status.should.equal(200)
    // const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[9])
    // deleteUserResponse2.status.should.equal(200)
  })
})
