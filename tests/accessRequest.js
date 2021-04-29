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
const ETH_CRYPTO = require('eth-crypto')

const newAccessRequest = async (researchInstitutionManagerAddress, project) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    researchInstitutionManagerAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const accessRequestsUrl = `${BASE_URL}/accessRequests`
  const postAccessRequestsResponse = await AXIOS.post(accessRequestsUrl, project, axiosConfig)
  return postAccessRequestsResponse
}

const grantAccessRequest = async (endUserAddress, researchInstitutionManagerAddress, projectAddress) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    endUserAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const contract = await USER_UTILS.getContract()
  const receipt = await contract.methods.grantPermissionToInstitution(
    researchInstitutionManagerAddress, projectAddress).send({ from: endUserAddress })
  receipt.should.have.property('transactionHash')
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const getAccessRequestsUrl = `${BASE_URL}/accessRequests`
  const getAccessRequestResponse = await AXIOS.get(getAccessRequestsUrl, axiosConfig)
  const publicKey = getAccessRequestResponse.data.accessRequests.filter((x) => {
    return researchInstitutionManagerAddress === x.researchInstitutionManagerAddress
  })[0].publicKey.publicKey
  const encryptedPassword = await ETH_CRYPTO.encryptWithPublicKey(
    publicKey, 'S3Cr3T_PasSw0Rd')
  const accessRequestsUrl = `${BASE_URL}/accessRequest/${researchInstitutionManagerAddress}`
  const request = { pendingBC: true, encryptedPassword: encryptedPassword }
  axiosConfig.params = { projectAddress: projectAddress }
  const putAccessRequestsResponse = await AXIOS.put(accessRequestsUrl, request, axiosConfig)
  return putAccessRequestsResponse
}

const revokeAccessRequest = async (endUserAddress, researchInstitutionManagerAddress, projectAddress) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    endUserAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const contract = await USER_UTILS.getContract()
  const receipt = await contract.methods.revokePermissionToInstitution(
    researchInstitutionManagerAddress, projectAddress).send({ from: endUserAddress })
  receipt.should.have.property('transactionHash')
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token }, params: { projectAddress: projectAddress } }
  const accessRequestsUrl = `${BASE_URL}/accessRequest/${researchInstitutionManagerAddress}`
  const request = { pendingBC: true, encryptedPassword: {} }
  const putAccessRequestsResponse = await AXIOS.put(accessRequestsUrl, request, axiosConfig)
  return putAccessRequestsResponse
}

const deleteAccessRequest = async (endUserAddress, researchInstitutionManagerAddress, projectAddress) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    endUserAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token }, params: { projectAddress: projectAddress } }
  const accessRequestUrl = `${BASE_URL}/accessRequest/${researchInstitutionManagerAddress}`
  const deleteAccessRequestResponse = AXIOS.delete(accessRequestUrl, axiosConfig)
  return deleteAccessRequestResponse
}

const getAccessRequests = async (userAddress, filter) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    userAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const accessRequestsUrl = `${BASE_URL}/accessRequests`
  if (filter) {
    axiosConfig.params = { filter: filter }
  }
  const getAccessRequestsResponse = await AXIOS.get(accessRequestsUrl, axiosConfig)
  return getAccessRequestsResponse
}

const getProjects = async (userAddress) => {
  const { token } = await REGISTER_UTILS.simulateLogin(
    userAddress, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const projectsUrl = `${BASE_URL}/projects`
  const getProjectsResponse = await AXIOS.get(projectsUrl, axiosConfig)
  return getProjectsResponse
}

module.exports = {
  newAccessRequest: newAccessRequest,
  deleteAccessRequest: deleteAccessRequest,
  getAccessRequests: getAccessRequests,
  grantAccessRequest: grantAccessRequest,
  revokeAccessRequest: revokeAccessRequest,
  getProjects: getProjects
}
