const bip39 = require('bip39')
const HDKey = require('hdkey')
const ethUtil = require('ethereumjs-util')

const createProjectAddress = async function (string) {
  const seed = await bip39.mnemonicToSeed(string)
  const root = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
  const addressNode = root.derive("m/44'/60'/0'/0/0")
  const publicKey = ethUtil.privateToPublic(addressNode.privateKey)
  const address = ethUtil.publicToAddress(publicKey).toString('hex')
  const ethereumAddress = ethUtil.toChecksumAddress(address)
  return ethereumAddress
}

module.exports = {
  createProjectAddress
}
