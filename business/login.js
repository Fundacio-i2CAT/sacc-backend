require('dotenv').config()

const ETHERUTIL = require('ethereumjs-util')
const USER = require('../schemas/user.js')
const PUBLIC_KEY = require('../schemas/publicKey.js')
const JWT = require('jsonwebtoken')
const WEB3_API = require('web3')
const WEB3 = new WEB3_API(process.env.INFURA_HTTPS, null)

const generateChallenge = async function (address) {
  const challenge = (new Date()).getTime().toString()
  USER.updateChallenge(address, challenge)
  return challenge
}

const validate = async (address, signature) => {
  // Rebuilding the corresponding hash
  const challenge = await USER.getChallenge(address)
  const hash = WEB3.utils.soliditySha3(
    { t: 'address', v: address },
    { t: 'uint256', v: challenge.challenge.toString() })
  // Extracting hexMessage buffer from signature data structure
  const hexMessage = Buffer.from(
    signature.messageHash.substring(2), 'hex')
  if (hash !== signature.message) {
    // Hashes do not match, not valid signature
    console.error('Hashes do not match')
    throw new Error('Hashes do not match')
  }
  // Recovering public key using ethereumjs-util ecrecover
  const publicKey = await ETHERUTIL.ecrecover(
    hexMessage, signature.v,
    signature.r,
    signature.s)
  // Address format conversion (from public key to address string
  const addressHex = '0x' + await ETHERUTIL.pubToAddress(publicKey).toString('hex')
  if (addressHex.toLowerCase() !== address.toLowerCase()) {
    // Recovered Address do not match
    console.error('Incorrect key')
    throw new Error('Incorrect public key recovered')
  }
  const signedJWT = await JWT.sign({ address: address }, process.env.SECRET, { expiresIn: process.env.JWT_EXPIRATION_TIME })
  await USER.deleteChallenge(address)
  await PUBLIC_KEY.newPublicKey(address, publicKey.toString('hex'))
  return { address: address, accessToken: signedJWT, expiresIn: process.env.JWT_EXPIRATION_TIME }
}

const checkSignature = async function (signatureString, address) {
  const signature = await ETHERUTIL.fromRpcSig(signatureString)
  const challenge = await USER.getChallenge(address)
  const publicKey = await ETHERUTIL.ecrecover(ETHERUTIL.keccak256(challenge.challenge), signature.v, signature.r, signature.s)
  const addressHex = '0x' + await ETHERUTIL.pubToAddress(publicKey).toString('hex')
  const bodyAddress = address.toLowerCase()
  if (addressHex !== bodyAddress) {
    throw new Error('Incorrect signature: Unauthorized')
  }
  const signedJWT = await JWT.sign({ address: address }, process.env.SECRET, { expiresIn: process.env.JWT_EXPIRATION_TIME })
  await USER.deleteChallenge(address)
  await PUBLIC_KEY.newPublicKey(address, publicKey.toString('hex'))
  return { address: address, accessToken: signedJWT, expiresIn: process.env.JWT_EXPIRATION_TIME }
}

module.exports = {
  checkSignature: checkSignature,
  generateChallenge: generateChallenge,
  validate: validate
}
