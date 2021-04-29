const MONGOOSE = require('mongoose')
const MONGOOSE_TIMESTAMP = require('mongoose-timestamp')

class ValidationError extends Error {}

const SCHEMA = MONGOOSE.Schema

const PUBLIC_KEY_SCHEMA = new SCHEMA({
  address: { type: String, unique: true, required: true },
  publicKey: { type: String }
})

PUBLIC_KEY_SCHEMA.plugin(MONGOOSE_TIMESTAMP)

const PUBLIC_KEY = MONGOOSE.model(
  'PublicKey',
  PUBLIC_KEY_SCHEMA
)

const getPublicKey = async function (address) {
  const publicKey = await PUBLIC_KEY.findOne({
    address: address.toLowerCase()
  })
  return publicKey
}

const newPublicKey = async function (address, publicKey) {
  try {
    const object = {
      address: address.toLowerCase(),
      publicKey: publicKey
    }
    const model = await PUBLIC_KEY.create(object)
    return model.id
  } catch (error) {
    if (error.code === 11000) {
      return undefined
    }
    if (error.name === 'ValidationError') {
      throw new ValidationError()
    }
    throw new Error('Unexpected error')
  }
}

module.exports = {
  PublicKey: PUBLIC_KEY,
  PublicKeySchema: PUBLIC_KEY_SCHEMA,
  getPublicKey: getPublicKey,
  newPublicKey: newPublicKey,
  ValidationError: ValidationError
}
