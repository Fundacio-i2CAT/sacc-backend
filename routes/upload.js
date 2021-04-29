require('dotenv').config()

const FS = require('fs')

module.exports = function (app) {
  app.post('/upload', async (req, res) => {
    try {
      if (!req.body.data) {
        res.send({
          status: false,
          message: 'No data uploaded'
        })
      }
    } catch (err) {
      console.log(err)
    }
    FS.writeFileSync(`./public/data/${req.user.address.toLowerCase()}`, JSON.stringify(req.body), 'utf8')
    res.send()
  })

  app.get('/upload', async (req, res) => {
    try {
      const file = JSON.parse(FS.readFileSync(`./public/data/${req.query.endUserAddress.toLowerCase()}`, 'utf8'))
      res.send(file.data)
    } catch(err) {
      console.log(err)
    }
  })
}
