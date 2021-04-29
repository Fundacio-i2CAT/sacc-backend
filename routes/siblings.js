require('dotenv').config()

const FS = require('fs')
const WEB3_API = require('web3')
const WEB3 = new WEB3_API(process.env.INFURA_HTTPS, null)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)
/* eslint no-extend-native: ["error", { "exceptions": ["Object"] }] */
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () { return this.toString() }

module.exports = function (app, merkleTree) {
  /**
   * @swagger
   * /siblings:
   *    get:
   *      summary: Gets siblings of the Merkle Tree
   *      description: Allows an endUser to get their siblings.
   *      tags:
   *        - siblings
   *      parameters:
   *        - in: header
   *          name: Authorization
   *          schema:
   *            type: string
   *            example: Bearer eyJhbGciOiJIUzI ... 6Q-CqWsgoBmzEnGOPmNKqdiX8Tn2y7JTA
   *      responses:
   *        '200':
   *          description: Everything went ok
   *          schema:
   *            type: object
   *            properties:
   *              found:
   *                type: boolean
   *                example: true
   *              isOld0:
   *                type: boolean
   *                example: false
   *              foundValue:
   *                type: string
   *                example: 23
   *              siblings:
   *                type: array
   *                items:
   *                  type: string
   *                  example: 24
   *        403:
   *          description: User is not a endUser and therefore cannot get siblings information
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/siblings', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole === 1) {
      const node = await merkleTree.find(BigInt(address))
      node.root = merkleTree.root
      res.status(200)
      return res.send(JSON.stringify(node))
    }
    res.status(403)
    return res.send({ error: 'Get access request Forbidden' })
  })
}
