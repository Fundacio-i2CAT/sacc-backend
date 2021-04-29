require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_TEST_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)
WEB3.eth.transactionConfirmationBlocks = 1
WEB3.transactionConfirmationBlocks = 1
const AXIOS = require('axios')
const BASE_URL = `http://${process.env.GETH_IP_ADDRESS}:${process.env.PORT}`
const FS = require('fs')
const REGISTER_UTILS = require('./register.js')

const getContract = async () => {
  const abi = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
  return new WEB3.eth.Contract(abi, process.env.CONTRACT_ADDRESS)
}

const onboardUserOnChain = async (adminAddress, address, role) => {
  const contract = await getContract()
  const receipt = await contract.methods.setUserRole(address, role).send({ from: adminAddress })
  return receipt
}

const deleteUserOnChain = async (adminAddress, address) => {
  const contract = await getContract()
  const receipt = await contract.methods.setUserRole(address, 0).send({ from: adminAddress })
  return receipt
}

const unregisterUser = async (address) => {
  const contract = await getContract()
  const receipt = await contract.methods.unregisterUser().send({ from: address })
  return receipt
}

const newUser = async (
  adminAddress,
  address,
  name,
  surnames,
  phone,
  email,
  institutionName,
  cardId,
  role,
  dataUrl,
  firebaseCloudToken) => {
  const response = await REGISTER_UTILS.registerRequest(
    address, name, surnames, phone, email, institutionName, cardId, role, dataUrl, firebaseCloudToken)
  response.status.should.equal(200)
  let contractRole = 4
  if (role === 'END_USER') {
    contractRole = 1
  }
  const onboardResponse = await onboardUserOnChain(adminAddress, address, contractRole)
  onboardResponse.transactionHash.should.be.a('string')
  // const { token } = await REGISTER_UTILS.simulateLogin(adminAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  // const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  // const userUrl = `${BASE_URL}/user`
  // const request = { address: address }
  // const postUserResponse = await AXIOS.post(userUrl, request, axiosConfig)
  return { status: 200 }
}

const updateUser = async (address, body) => {
  const { token } = await REGISTER_UTILS.simulateLogin(address, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const updateUrl = `${BASE_URL}/user`
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const putResponse = await AXIOS.put(updateUrl, body, axiosConfig)
  return putResponse
}

const deleteUser = async (adminAddress, address) => {
  const deleteResponse = await deleteUserOnChain(adminAddress, address)
  deleteResponse.transactionHash.should.be.a('string')
  const { token } = await REGISTER_UTILS.simulateLogin(adminAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const deleteUrl = `${BASE_URL}/user/${address}`
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const deleteUserResponse = await AXIOS.delete(deleteUrl, axiosConfig)
  return deleteUserResponse
}

module.exports = {
  deleteUser: deleteUser,
  getContract: getContract,
  onboardUserOnChain: onboardUserOnChain,
  deleteUserOnChain: deleteUserOnChain,
  updateUser: updateUser,
  newUser: newUser,
  unregisterUser: unregisterUser
}
