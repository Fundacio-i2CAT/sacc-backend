require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const AXIOS = require('axios')
const BASE_URL = `http://${process.env.GETH_IP_ADDRESS}:${process.env.PORT}`

describe('Wasm test', function () {
  it('Should allow any user to retrieve TopicProof.wasm', async () => {
    const wasmUrl = `${BASE_URL}/TopicsProof.wasm`
    const wasmResponse = await AXIOS.get(wasmUrl)
    wasmResponse.status.should.equal(200)
  })
})
