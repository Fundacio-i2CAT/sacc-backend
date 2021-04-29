require('dotenv').config()

const REQUEST = require('../business/accessRequest.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WEB3 = new WEB3_API(process.env.INFURA_HTTPS, null)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)

module.exports = function (app) {
  /**
   * @swagger
   * /projects:
   *    get:
   *      summary: Gets projects
   *      description: Allows an endUser or research institution manager to get projects.
   *      tags:
   *        - project
   *      parameters:
   *        - in: form
   *          description: Page number
   *          name: page
   *          required: false
   *          schema:
   *            type: number
   *            example: 1
   *        - in: form
   *          description: Item limit
   *          name: limit
   *          required: false
   *          schema:
   *            type: number
   *            example: 10
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
   *              projects:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    stats:
   *                      type: object
   *                      properties:
   *                        granted:
   *                          type: integer
   *                        rejected:
   *                          type: integer
   *                        pending:
   *                          type: integer
   *                        revoked:
   *                          type: integer
   *                    researchInstitutionManagerAddress:
   *                     type: string
   *                    researchInstitutionManager:
   *                      type: object
   *                      properties:
   *                        address:
   *                          type: string
   *                        firstName:
   *                          type: string
   *                        surnames:
   *                          type: string
   *                        phone:
   *                          type: string
   *                        email:
   *                          type: string
   *                        institutionName:
   *                          type: string
   *                        cardId:
   *                          type: string
   *                          format: nullable
   *                        role:
   *                          type: string
   *                        updatedAt:
   *                          type: string
   *                        createdAt:
   *                          type: string
   *                    title:
   *                      type: string
   *                    description:
   *                      type: string
   *              totalDocs:
   *                type: integer
   *                format: int32
   *              totalPages:
   *                type: integer
   *                format: int32
   *              hasPrevPage:
   *                type: boolean
   *              hasNextPage:
   *                type: boolean
   *              page:
   *                type: integer
   *                format: int32
   *              limit:
   *                type: integer
   *                format: int32
   *        403:
   *          description: User is not a endUser and therefore cannot grant/revoke an access request to hers/his information
   *                       or access has already been granted in smart contract or it was in the past
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/projects', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    let page = parseInt(req.query.page)
    let limit = parseInt(req.query.limit)
    if (isNaN(page) || page < 1) {
      page = 1
    }
    if (isNaN(limit) || limit < 1) {
      limit = 10
    }
    if (addressRole === 4) {
      const projects = await REQUEST.getProjects(
        page,
        limit,
        address
      )
      res.status(200)
      return res.send(projects)
    }
    res.status(403)
    return res.send({ error: 'Get access request Forbidden' })
  })
}
