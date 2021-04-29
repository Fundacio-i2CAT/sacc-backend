require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const AXIOS = require('axios')
const JWT = require('jsonwebtoken')
const BASE_URL = `http://${process.env.GETH_IP_TEST_ADDRESS}:${process.env.PORT}`

const simulateLogin = async (address, secret, expirationTime) => {
  const loginUrl = `${BASE_URL}/login`
  const loginPostResponse = await AXIOS.post(loginUrl, { address: address })
  loginPostResponse.status.should.equal(200)
  const userObject = { address: address }
  const expiration = { expiresIn: expirationTime }
  const signedJWT = await JWT.sign(userObject, secret, expiration)
  return { token: signedJWT }
}

const registerRequest = async function (
  address, firstName, surnames, phone, email, institutionName, cardId, role, dataUrl,
  firebaseCloudToken) {
  const { token } = await simulateLogin(address, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const registerUrl = `${BASE_URL}/registerRequest`
  const request = {
    firstName: firstName,
    surnames: surnames,
    phone: phone,
    email: email,
    institutionName: institutionName,
    cardId: cardId,
    role: role,
    dataUrl: dataUrl,
    firebaseCloudToken: firebaseCloudToken
  }
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const registerRequestResponse = await AXIOS.post(registerUrl, request, axiosConfig)
  return registerRequestResponse
}

const getRegisterRequests = async (address, page, limit, role) => {
  if (page === undefined) {
    page = 1
  }
  if (limit === undefined) {
    limit = 10
  }
  let url = `${BASE_URL}/registerRequest?page=${page}&limit=${limit}`
  if (role !== undefined) {
    url = url + `&role=${role}`
  }
  const { token } = await simulateLogin(address, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const response = await AXIOS.get(url, axiosConfig)
  return response
}

const deleteRequest = async (addressFrom, address) => {
  const { token } = await simulateLogin(addressFrom, process.env.SECRET, process.env.JWT_EXPIRATION_TIME)
  const deleteUrl = `${BASE_URL}/registerRequest/${address}`
  const axiosConfig = { headers: { Authorization: 'Bearer ' + token } }
  const deleteResponse = await AXIOS.delete(deleteUrl, axiosConfig)
  return deleteResponse
}

module.exports = {
  getRegisterRequests: getRegisterRequests,
  deleteRequest: deleteRequest,
  registerRequest: registerRequest,
  simulateLogin: simulateLogin
}
