const MONGOOSE = require('mongoose')
const MONGOOSE_PAGINATE = require('mongoose-paginate-v2')
const MONGOOSE_TIMESTAMP = require('mongoose-timestamp')

const SCHEMA = MONGOOSE.Schema

const REGISTER_REQUEST_SCHEMA = new SCHEMA({
  address: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  surnames: { type: String, required: true },
  cardId: { type: String, required: false },
  institutionName: { type: String, required: false },
  phone: String,
  email: String,
  dataUrl: { type: String, required: false },
  role: {
    type: String,
    enum: ['END_USER', 'LICENSE_MANAGER', 'RESEARCH_INSTITUTION_MANAGER'],
    required: true
  },
  firebaseCloudToken: { type: String, required: false },
  pendingBC: { type: Boolean, default: false },
  unregistered: { type: Boolean, default: false },
  asleep: { type: Boolean, default: false }
})

REGISTER_REQUEST_SCHEMA.plugin(MONGOOSE_PAGINATE)
REGISTER_REQUEST_SCHEMA.plugin(MONGOOSE_TIMESTAMP)

const REGISTER_REQUEST = MONGOOSE.model(
  'RegisterRequest',
  REGISTER_REQUEST_SCHEMA
)

REGISTER_REQUEST.paginate().then({})

class DuplicatedIndex extends Error {}
class ValidationError extends Error {}

const getRegisterRequest = async function (address) {
  const registerRequest = await REGISTER_REQUEST.findOne({
    address: address
  })
  return registerRequest
}

const getRegisterRequests = async function (page, limit, role) {
  const options = {
    page: page,
    limit: limit
  }
  const query = { role: role, pendingBC: false }
  const registerRequestPagination = await REGISTER_REQUEST.paginate(
    query,
    options
  )
  const registerRequests = {
    registerRequests: await REGISTER_REQUEST.find(query)
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ surnames: 1 }),
    totalDocs: registerRequestPagination.totalDocs,
    totalPages: registerRequestPagination.totalPages,
    hasPrevPage: registerRequestPagination.hasPrevPage,
    hasNextPage: registerRequestPagination.hasNextPage,
    page: registerRequestPagination.page,
    limit: registerRequestPagination.limit
  }
  return registerRequests
}

const newRegisterRequest = async function (
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
    const object = {
      address: address,
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
    const model = await REGISTER_REQUEST.create(object)
    return model.id
  } catch (error) {
    if (error.code === 11000) {
      throw new DuplicatedIndex()
    }
    if (error.name === 'ValidationError') {
      throw new ValidationError()
    }
    throw new Error('Unexpected error')
  }
}

module.exports = {
  RegisterRequest: REGISTER_REQUEST,
  RegisterRequestSchema: REGISTER_REQUEST_SCHEMA,
  getRegisterRequest: getRegisterRequest,
  getRegisterRequests: getRegisterRequests,
  newRegisterRequest: newRegisterRequest,
  DuplicatedIndex: DuplicatedIndex,
  ValidationError: ValidationError
}
