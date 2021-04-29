const FS = require('fs')

module.exports = function (app) {
  app.get('/circuit', async (req, res) => {
    try {
      const wasmAsBuffer = await FS.promises.readFile('./utils/circuit.wasm')
      const wasmAsArray = [...wasmAsBuffer]
      res.status(200)
      return res.send({ wasmAsArray })
    } catch (e) {
      res.status(500)
      return res.send({ e })
    }
  })
}
