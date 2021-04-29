require('dotenv').config()

class RegisterRequestError extends Error {}
class RequestAlreadySent extends RegisterRequestError {}
class RoleError extends RegisterRequestError {}

const REQUEST = require('../schemas/registerRequest.js')

const getRegisterRequest = async function (address) {
  const request = await REQUEST.getRegisterRequest(address)
  return request
}

const getRegisterRequests = async function (page, limit, role) {
  const request = await REQUEST.getRegisterRequests(page, limit, role)
  return request
}

const createRegisterRequest = async function (
  address,
  firstName,
  surnames,
  phone,
  email,
  institutionName,
  cardId,
  role,
  dataUrl,
  firebaseCloudToken
) {
  try {
    await REQUEST.newRegisterRequest(
      address,
      firstName,
      surnames,
      phone,
      email,
      institutionName,
      cardId,
      role,
      dataUrl,
      firebaseCloudToken
    )
  } catch (error) {
    if (error instanceof REQUEST.DuplicatedIndex) {
      throw new RequestAlreadySent('Request already sent')
    }
    if (error instanceof REQUEST.ValidationError) {
      throw new RoleError(
        'Role should be END_USER, LICENSE_MANAGER or RESEARCH_INSTITUTION_MANAGER'
      )
    }
    throw new Error('Unexpected error: ' + error)
  }
}

const manageBCRegisterRequest = async function (userAddress) {
  const request = await REQUEST.getRegisterRequest(userAddress)
  request.pendingBC = true
  request.save()
}

module.exports = {
  getRegisterRequest: getRegisterRequest,
  getRegisterRequests: getRegisterRequests,
  createRegisterRequest: createRegisterRequest,
  RequestAlreadySent: RequestAlreadySent,
  RoleError: RoleError,
  manageBCRegisterRequest: manageBCRegisterRequest
}
