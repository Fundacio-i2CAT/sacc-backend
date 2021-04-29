require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const MERKLE_TREE = require('circomlib').smt
const WALLET = require('ethereumjs-wallet')

describe('Merkle tree tests', function () {
  it('Should allow to create a Merkle Tree of Ethereum addresses', async () => {
    const len = 50
    const addresses = []
    for (let i = 0; i < len; i++) {
      const wallet = await WALLET.generate()
      addresses.push(wallet.getAddressString())
    }
    const tree = await MERKLE_TREE.newMemEmptyTrie()
    for (let i = 0; i < len; i++) {
      const response = await tree.insert(BigInt(addresses[i]), BigInt(addresses[i]))
      response.should.be.an('object')
      response.should.have.property('oldRoot')
    }
    tree.should.have.property('root')
    const anAddress = await tree.find(BigInt(addresses[Math.floor(Math.random() * (len - 1))]))
    anAddress.should.have.property('found')
    anAddress.found.should.equal(true)
    anAddress.should.have.property('siblings')
    anAddress.siblings.length.should.be.above(0)
  })
})
