require('dotenv').config()

class UserError extends Error {}
class UserAlreadyExists extends UserError {}
class RoleError extends Error {}

const USER = require('../schemas/user.js')
const REGISTER_REQUEST = require('../schemas/registerRequest.js')
const ACCESS_REQUEST = require('../schemas/accessRequest.js')

const unregisterUser = async function (address) {
  const user = await USER.unregisterUser(address)
  await ACCESS_REQUEST.revokeAllAccessRequests(address)
  return user
}

const getUser = async function (address) {
  const request = await USER.getUser(address)
  return request
}

const updateUser = async function (address, body) {
  const user = await USER.updateUser(address, body)
  return user
}

const getDataUrl = async function (address) {
  const request = await USER.getUser(address)
  return request.dataUrl
}

const getEndUserCount = async function () {
  const request = await USER.getEndUserCount()
  return request
}

const getUsers = async function (page, limit, role) {
  const request = await USER.getUsers(page, limit, role)
  return request
}

const createUser = async function (
  address,
  firstName,
  surnames,
  phone,
  email,
  institutionName,
  cardId,
  role,
  dataUrl,
  firebaseCloudToken) {
  try {
    await USER.newUser(
      address, firstName, surnames, phone, email, institutionName, cardId, role, dataUrl, firebaseCloudToken)
    // once the user is registered its register request is no longer needed
    const registerRequest = await REGISTER_REQUEST.getRegisterRequest(address)
    await registerRequest.remove()
  } catch (error) {
    if (error instanceof USER.DuplicatedIndex) {
      throw new UserAlreadyExists('User already exists')
    }
    if (error instanceof USER.ValidationError) {
      throw new RoleError('Role should be END_USER, LICENSE_MANAGER or RESEARCH_INSTITUTION_MANAGER')
    }
    throw new Error('Unexpected error: ' + error)
  }
}

module.exports = {
  getUser: getUser,
  getUsers: getUsers,
  createUser: createUser,
  UserError: UserError,
  UserAlreadyExists: UserAlreadyExists,
  RoleError: RoleError,
  getEndUserCount: getEndUserCount,
  getDataUrl: getDataUrl,
  updateUser: updateUser,
  unregisterUser: unregisterUser
}
