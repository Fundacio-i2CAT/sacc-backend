const USER = require('../schemas/user.js')
const R1CS_FILE = require('r1csfile').load
const SNARKJS = require('snarkjs')
const MERKLE_TREE = require('circomlib').smt
const FS = require('fs')
const TELEPORT = require('teleport-javascript').stringify
const TELERECEIVE = require('teleport-javascript').parse
/* eslint no-extend-native: ["error", { "exceptions": ["Object"] }] */
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () { return this.toString() }

const createTrustedSetup = async () => {
  const cR1cs = await R1CS_FILE('./utils/circuit.r1cs', true)
  // Creates trusted setup
  const setup = SNARKJS.groth.setup(cR1cs)
  const vkProof = setup.vk_proof
  const vkVerifier = setup.vk_verifier
  return { vkProof: vkProof, vkVerifier: vkVerifier }
}

module.exports = async function () {
  console.log('Loading Merkle Sparse tree from database ...')
  const endUsers = await USER.getEndUsers()
  const len = endUsers.length
  console.log(`End users array length = ${len}`)
  const addresses = []
  for (let i = 0; i < len; i++) {
    addresses.push(endUsers[i].address)
  }
  const tree = await MERKLE_TREE.newMemEmptyTrie()
  for (let i = 0; i < len; i++) {
    await tree.insert(BigInt(addresses[i]), BigInt(addresses[i]))
  }
  if (FS.existsSync('./trusted-setup/vk-proof-tp.json') && FS.existsSync('./trusted-setup/vk-verifier-tp.json')) {
    tree.trustedSetup =
      { vkProof: TELERECEIVE(FS.readFileSync('./trusted-setup/vk-proof-tp.json')),
        vkVerifier: TELERECEIVE(FS.readFileSync('./trusted-setup/vk-proof-tp.json')) }
    console.log('ZK-Snarks Trusted setup restored from disk')
  } else {
    tree.trustedSetup = await createTrustedSetup()
    FS.writeFileSync('./trusted-setup/vk-proof-tp.json', TELEPORT(tree.trustedSetup.vkProof))
    FS.writeFileSync('./trusted-setup/vk-verifier-tp.json', TELEPORT(tree.trustedSetup.vkVerifier))
    FS.writeFileSync('./trusted-setup/vk-proof.json', JSON.stringify(tree.trustedSetup.vkProof))
    FS.writeFileSync('./trusted-setup/vk-verifier.json', JSON.stringify(tree.trustedSetup.vkVerifier))
    console.log('ZK-Snarks Trusted setup generated and stored')
  }
  console.log('Tree successfully loaded')
  console.log(`Root: ${tree.root.value}`)
  return tree
}
