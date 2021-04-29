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
   * /accessRequests:
   *    post:
   *      summary: Posts an access request for all endUsers in the system.
   *      description: Endpoint that allows a research institution manager to request access to endUsers information.
   *      tags:
   *        - accessRequest
   *      parameters:
   *        - in: header
   *          name: Authorization
   *          schema:
   *            type: string
   *            example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzxsoaAHg2RWU2MzhmYkE1MznF67189mNFNzcwNWFCNUI4ODc2Mjk4OTRooTE2IiwiaWF0IjoxNTYzOYYzNmK8xCJleHAiOjE1NjQwNTEwOTN9.EC3CgBEhzg6Q-CqWsgoBmzEnGOPmNKqdiX8Tn2y7JTA
   *        - in: header
   *          name: Content-Type
   *          schema:
   *            type: string
   *            example: application/json
   *      responses:
   *        200:
   *          description: Everything went ok.
   *          schema:
   *            type: object
   *            properties:
   *              projectAddress:
   *                type: string
   *                example: "0x41B301c0b0AbbFEef99803c23A281712e29B6EF1"
   *        403:
   *          description: User is not a research institution manager and since is not allowed to request access.
   *        500:
   *          description: Unexpected exception happened.
   */
  app.post('/accessRequests', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    // Only research institution managers allowed to post
    if (addressRole !== 4) {
      res.status(403)
      return res.send({ error: 'Forbidden access request' })
    }
    if (!req.body.project) {
      res.status(400)
      return res.send({ error: 'Lack of project title and description' })
    }
    let projectAddress
    try {
      projectAddress = await REQUEST.createAccessRequests(address, req.body.project)
    } catch (error) {
      res.status(500)
      console.log(error)
      return res.send({ error: error.message })
    }
    res.status(200)
    return res.send({ projectAddress: projectAddress })
  })

  /**
   * @swagger
   * /accessRequest/{researchInstitutionManagerAddress}:
   *    put:
   *      summary: Grants or revokes an access request from a research institution manager to endUser's information.
   *      description: Allows a endUser to grant or revoke an access request.
   *      tags:
   *        - accessRequest
   *      parameters:
   *        - in: path
   *          description: Research institution manager that requested access
   *          name: researchInstitutionManagerAddress
   *          required: true
   *          schema:
   *            type: string
   *            example: "0x6Ee638fbA5908354fcE7705aB5B887629894fE16"
   *        - in: body
   *          description: Body
   *          name: Body
   *          schema:
   *            type: object
   *            properties:
   *              granted:
   *                type: boolean
   *                example: true
   *              revoked:
   *                type: boolean
   *                example: false
   *              pendingBC:
   *                type: boolean
   *                example: true
   *              encryptedPassword:
   *                type: object
   *                properties:
   *                  iv:
   *                    type: string
   *                    example: 310df91d3db8792f779204b22b749b5d
   *                  ephemPublicKey:
   *                    type: string
   *                    example: 04210e7f65801a619faf76ff9b7435ce99a2a041fe5c647a4ce4150e66acdc1b7d1827ba159cca0810013a73b28932b6f984f1f1edd13d66ee325a95291a64a7ce
   *                  ciphertext:
   *                    type: string
   *                    example: 1e4b99adbd257bde8b1d972f4928297a
   *                  mac:
   *                    type: string
   *                    example: 1e25790492bfd249eda545208957002594d6015c6f139fbd63da88c6693c554c
   *            examples:
   *              granted:
   *                value:
   *                  granted: true
   *              revoked:
   *                value:
   *                  revoked: true
   *              pendingBC:
   *                value:
   *                  revoked: true
   *        - in: header
   *          name: Authorization
   *          schema:
   *            type: string
   *            example: Bearer eyJhbGciOiJIUzI ... 6Q-CqWsgoBmzEnGOPmNKqdiX8Tn2y7JTA
   *        - in: header
   *          name: Content-Type
   *          schema:
   *            type: string
   *            example: application/json
   *      responses:
   *        200:
   *          description: Everything went ok.
   *        403:
   *          description: User is not a endUser and therefore cannot grant/revoke an access request to hers/his information
   *                       or access has not been granted in smart contract.
   *        500:
   *          description: Unexpected exception happened.
   */
  app.put(
    '/accessRequest/:researchInstitutionManagerAddress',
    async (req, res) => {
      const researchInstitutionManagerAddress = req.params.researchInstitutionManagerAddress.toLowerCase()
      const address = req.user.address.toLowerCase()
      const addressRole = await CONTRACT.methods.userRoles(address).call()
      const unregisteredUser = await CONTRACT.methods.unregisteredUsers(address).call()
      if (unregisteredUser) {
        res.status(403)
        return res.send({
          error: 'Only not unregistered users can grant or revoke access requests'
        })
      }
      const projectAddress = req.query.projectAddress
      if (addressRole !== 1) {
        res.status(403)
        return res.send({
          error: 'Only endUsers can grant or revoke access requests'
        })
      }
      if (!projectAddress) {
        res.status(400)
        return res.send({
          error: 'Lack of project address'
        })
      }
      if (req.body.pendingBC) {
        try {
          await REQUEST.manageBCAccessRequest(
            address,
            researchInstitutionManagerAddress,
            req.body.encryptedPassword,
            projectAddress
          )
        } catch (error) {
          res.status(500)
          return res.send({ error: error })
        }
      }
      res.status(200)
      return res.send()
    }
  )

  /**
   * @swagger
   * /accessRequest/{researchInstitutionManagerAddress}:
   *    delete:
   *      summary: Deletes an access request.
   *      description: Allows a endUser to delete an access request from a particular
   *        research institution manager from the backend; the idea is to
   *        allow an end user to ignore an access request without further requirements than
   *        use this endpoint (no smart contract interaction required).
   *      tags:
   *        - accessRequest
   *      parameters:
   *        - in: path
   *          description: Research institution manager that requested access
   *          name: researchInstitutionManagerAddress
   *          required: true
   *          schema:
   *            type: string
   *            example: "0x6Ee638fbA5908354fcE7705aB5B887629894fE16"
   *        - in: header
   *          name: Authorization
   *          schema:
   *            type: string
   *            example: Bearer eyJhbGciOiJIUzI ... 6Q-CqWsgoBmzEnGOPmNKqdiX8Tn2y7JTA
   *      responses:
   *        200:
   *          description: Everything went ok
   *        403:
   *          description: User is not a endUser and therefore cannot grant/revoke an access request to hers/his information
   *                       or access has already been granted in smart contract or it was in the past
   *        500:
   *          description: Unexpected exception happened
   */
  app.delete(
    '/accessRequest/:researchInstitutionManagerAddress',
    async (req, res) => {
      const researchInstitutionManagerAddress = req.params.researchInstitutionManagerAddress.toLowerCase()
      const address = req.user.address.toLowerCase()
      const addressRole = await CONTRACT.methods.userRoles(address).call()
      if (addressRole !== 1) {
        res.status(403)
        return res.send({ error: 'Delete access request forbidden' })
      }
      const alreadyGranted = await CONTRACT.methods
        .permissionsAllowedFromUser(address, researchInstitutionManagerAddress, req.query.projectAddress)
        .call()
      if (alreadyGranted) {
        res.status(403)
        return res.send({
          error: 'Access request already granted in the blockchain'
        })
      }
      const accessRequest = await REQUEST.getAccessRequest(
        address,
        researchInstitutionManagerAddress,
        req.query.projectAddress
      )
      if (accessRequest === null) {
        res.status(404)
        return res.send({ error: 'Access request not found' })
      }
      if (!process.env.DEVELOPMENT) {
        if (accessRequest.granted || accessRequest.revoked) {
          res.status(403)
          return res.send({
            error: 'Access request has been granted in the past, cannot delete'
          })
        }
      }
      await accessRequest.remove()
      res.status(200)
      return res.send()
    }
  )

  /**
   * @swagger
   * /accessRequests:
   *    get:
   *      summary: Gets access requests.
   *      description: Allows a endUser or research institution manager to get access requests; if the user
   *        is an end user or endUser, this endpoint returns pending paginated access requests including
   *        research institution information
   *        otherwise, in case the caller is a research institution manager, the endpoint returns same format
   *        paginated list of the status of the access requests granted or revoked including only endUser's
   *        public Ethereum address in order to provide data tracking capabilities without providing
   *        further personal information.
   *      tags:
   *        - accessRequest
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
   *              accessRequests:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    publicKey:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         example: 5d6e170dc88e1551bc61cada
   *                       address:
   *                         type: string
   *                         example: 0x5be82e4507194e6ade12f137f6b719b6396a09e6
   *                       publicKey:
   *                         type: string
   *                         example: 3babdc69cf9b70e93f7713dffbf069f943f4278180d7d7f33ab4e67e7eb311c58c8a3a028c634a90d4fbf08f28c9e2c7d43c626d2b784d37d18082e0320e1b13
   *                       updatedAt:
   *                         type: string
   *                         example: 2019-09-03T07:32:29.063Z
   *                       createdAt:
   *                         type: string
   *                         example: 2019-09-03T07:32:29.063Z
   *                       __v:
   *                         type: string
   *                         example: 0
   *                    encryptedPassword:
   *                      type: object
   *                      properties:
   *                        iv:
   *                          type: string
   *                          example: 310df91d3db8792f779204b22b749b5d
   *                        ephemPublicKey:
   *                          type: string
   *                          example: 04210e7f65801a619faf76ff9b7435ce99a2a041fe5c647a4ce4150e66acdc1b7d1827ba159cca0810013a73b28932b6f984f1f1edd13d66ee325a95291a64a7ce
   *                        ciphertext:
   *                          type: string
   *                          example: 1e4b99adbd257bde8b1d972f4928297a
   *                        mac:
   *                          type: string
   *                          example: 1e25790492bfd249eda545208957002594d6015c6f139fbd63da88c6693c554c
   *                    researchInstitutionManagerAddress:
   *                     type: string
   *                    endUserAddress:
   *                      type: string
   *                    revoked:
   *                      type: boolean
   *                    granted:
   *                      type: boolean
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
  app.get('/accessRequests', async (req, res) => {
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
      const researchInstitutionManagerAccessRequests = await REQUEST.getResearchInstitutionManagerAccessRequests(
        page,
        limit,
        address,
        req.query
      )
      res.status(200)
      return res.send(researchInstitutionManagerAccessRequests)
    }
    if (addressRole !== 1) {
      res.status(403)
      return res.send({ error: 'Get access request Forbidden' })
    }
    const accessRequests = await REQUEST.getAccessRequests(
      page,
      limit,
      address,
      req.query
    )
    res.status(200)
    return res.send(accessRequests)
  })
}
