require('dotenv').config()

const EXPRESS = require('express')
const BODY_PARSER = require('body-parser')
const APP = EXPRESS()
const MONGOOSE = require('mongoose')
const JWT = require('express-jwt')
const FILEUPLOAD = require('express-fileupload')

const MONGO_DB = 'mongodb://127.0.0.1/blockchain_hda'
MONGOOSE.connect(MONGO_DB, { useNewUrlParser: true })
MONGOOSE.Promise = global.Promise
const DB = MONGOOSE.connection
DB.on('error', console.error.bind(console, 'MongoDB connection error:'))

const SWAGGER_JS_DOC = require('swagger-jsdoc')

const OPTIONS = {
  swaggerDefinition: {
    info: {
      title: 'Blockchain HDA API',
      version: '1.0.0',
      description: 'Blockchain HDA API documentation'
    }
  },
  apis: ['./routes/*.js']
}

const SPECS = SWAGGER_JS_DOC(OPTIONS)
const SWAGGER_UI = require('swagger-ui-express')

const TOPIC_BOOTSTRAPPING = require('./utils/topic-bootstrapping.js')
TOPIC_BOOTSTRAPPING()

APP.use(EXPRESS.static('public'))
APP.use('/api-docs', SWAGGER_UI.serve, SWAGGER_UI.setup(SPECS))
APP.use(BODY_PARSER.urlencoded({ extended: false }))
APP.use(BODY_PARSER.json())
APP.use(
  JWT({ secret: process.env.SECRET }).unless({ path: ['/login', '/api-docs', '/circuit', '/topic'] })
)
APP.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(err.status).send({ message: 'Invalid JWT Signature' })
    return
  }
  next()
})

if (process.env.CORS) {
  const cors = require('cors')
  APP.use(cors())
} else {
  APP.use(EXPRESS.static('public'))
  APP.use(EXPRESS.static('files'))
  APP.use('/', EXPRESS.static('../client/build'))
}

APP.use(FILEUPLOAD({ createParentPath: true }))
const UPLOAD = require('./routes/upload.js')
UPLOAD(APP)

let SERVER

const LOAD_APP = async () => {
  const MERKLE_LOAD = require('./utils/merkle-load.js')
  const MERKLE_TREE = await MERKLE_LOAD()

  const ROUTES = require('./routes/index.js')
  await ROUTES(APP, MERKLE_TREE)

  const LISTENERS = require('./listeners/index.js')
  await LISTENERS(MERKLE_TREE)

  SERVER = APP.listen(process.env.PORT, process.env.SERVER_ADDRESS, () =>
    console.log(`Blockchain-HDA back-end listening on port ${process.env.PORT}!`))
}

LOAD_APP()

const SHUTDOWN = async () => {
  console.log('Shutting down server')
  SERVER.close()
}

module.exports = {
  shutdown: SHUTDOWN
}
