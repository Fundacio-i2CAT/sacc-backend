const MONGOOSE = require('mongoose').set('useCreateIndex', true)

const SCHEMA = MONGOOSE.Schema
const REGISTER_REQUEST = require('./registerRequest.js')

const CHALLENGE_SCHEMA = new SCHEMA({
  address: { type: String, unique: true },
  challenge: String })

const CHALLENGE = MONGOOSE.model('Challenge', CHALLENGE_SCHEMA)

const updateChallenge = async function (address, challenge) {
  const challengeModel = await CHALLENGE.findOne({ address: address })
  if (challengeModel === null) {
    await CHALLENGE.create({ address: address, challenge: challenge })
    return
  }
  await challengeModel.updateOne({ challenge: challenge })
}

const getChallenge = async function (address) {
  const challengeModel = await CHALLENGE.findOne({ address: address })
  return challengeModel
}

const deleteChallenge = async function (address) {
  const challengeModel = await CHALLENGE.findOne({ address: address })
  challengeModel.remove()
}

const USER = MONGOOSE.model('User', REGISTER_REQUEST.RegisterRequestSchema)

USER.paginate().then({})

class DuplicatedIndex extends Error {}
class ValidationError extends Error {}

const getUser = async function (address) {
  const user = await USER.findOne({ address: address })
  return user
}

const unregisterUser = async function (address) {
  const user = await USER.findOne({ address: address.toLowerCase() })
  user.unregistered = true
  await user.save()
  return user
}

const updateUser = async function (address, body) {
  console.log(body.asleep)
  const user = await USER.findOne({ address: address })
  if (body.firstName) {
    user.firstName = body.firstName
  }
  if (body.surnames) {
    user.surnames = body.surnames
  }
  if (body.phone) {
    user.phone = body.phone
  }
  if (body.email) {
    user.email = body.email
  }
  if (body.institutionName) {
    user.institutionName = body.institutionName
  }
  if (body.cardId) {
    user.cardId = body.cardId
  }
  if (body.dataUrl) {
    user.dataUrl = body.dataUrl
  }
  if (body.firebaseCloudToken) {
    user.firebaseCloudToken = body.firebaseCloudToken
  }
  if (body.asleep) {
    user.asleep = body.asleep
  }
  await user.save()
  return user
}

const getUsers = async function (page, limit, role) {
  const options = {
    page: page,
    limit: limit
  }
  const query = { role: role, unregistered: false }
  const userPagination = await USER.paginate(query, options)
  const users = {
    users: await USER.find(query).limit(limit).skip(limit * (page - 1)).sort({ surnames: 1 }),
    totalDocs: userPagination.totalDocs,
    totalPages: userPagination.totalPages,
    hasPrevPage: userPagination.hasPrevPage,
    hasNextPage: userPagination.hasNextPage,
    page: userPagination.page,
    limit: userPagination.limit
  }
  return users
}

const getEndUsers = async function () {
  console.log('Getting end users')
  const role = 'END_USER'
  const limit = await getEndUserCount()
  console.log(`Limit = ${limit}`)
  const query = { role: role, unregistered: false }
  return USER.find(query).limit(limit)
}

const getEndUserCount = async function () {
  const count = await USER.countDocuments({ role: 'END_USER', unregistered: false })
  return count
}

const newUser = async function (
  address, firstName, surnames, phone, email, institutionName, cardId, role, dataUrl, firebaseCloudToken) {
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
    const model = await USER.create(object)
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
  User: USER,
  Challenge: CHALLENGE,
  DuplicatedIndex: DuplicatedIndex,
  ValidationError: ValidationError,
  updateChallenge: updateChallenge,
  getChallenge: getChallenge,
  deleteChallenge: deleteChallenge,
  getUser: getUser,
  getUsers: getUsers,
  newUser: newUser,
  getEndUserCount: getEndUserCount,
  updateUser: updateUser,
  getEndUsers: getEndUsers,
  unregisterUser: unregisterUser
}
