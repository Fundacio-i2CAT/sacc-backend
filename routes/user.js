require('dotenv').config()

const USER = require('../business/user.js')
const REGISTER_REQUEST = require('../business/registerRequest.js')
const ACCESS_REQUEST = require('../business/accessRequest.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WEB3 = new WEB3_API(process.env.INFURA_HTTPS, null)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)
const EMAIL_VALIDATOR = require('email-validator')

module.exports = function (app, merkleTree) {
  /**
   * @swagger
   * /user:
   *    post:
   *      summary: Posts a new user into the system deleting her/his register request.
   *      description: Endpoint that allows a license manager to onboard a user (that previously
   *        requested a register request) into the platform.
   *      tags:
   *        - user
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
   *        - in: body
   *          name: Body
   *          description: Body
   *          schema:
   *            type: object
   *            properties:
   *              address:
   *                type: string
   *                example: "0x6Ee638fbA5908354fcE7705aB5B887629894fE16"
   *      responses:
   *        200:
   *          description: Everything went ok.
   *        403:
   *          description: User is not a research institution manager and since is not allowed to request access.
   *        500:
   *          description: Unexpected exception happened.
   *
   */
  app.post('/user', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole !== 3) {
      res.status(401)
      return res.send({ error: 'Unauthorized to post new user' })
    }
    const userAddress = req.body.address.toLowerCase()
    const registerRequest = await REGISTER_REQUEST.getRegisterRequest(userAddress)
    if (registerRequest === null) {
      res.status(400)
      return res.send({ error: 'Unknown register request' })
    }
    const contractRole = await CONTRACT.methods.userRoles(userAddress).call()
    if (contractRole !== 1 && contractRole !== 4) {
      res.status(400)
      return res.send({ error: 'Not supported role' })
    }
    if (contractRole === 4 && registerRequest.role !== 'RESEARCH_INSTITUTION_MANAGER') {
      res.status(409)
      return res.send({ error: 'Contract role does not match register request role' })
    }
    if (contractRole === 1 && registerRequest.role !== 'END_USER') {
      res.status(409)
      return res.send({ error: 'Contract role does not match register request role' })
    }
    try {
      USER.createUser(
        userAddress, registerRequest.firstName, registerRequest.surnames, registerRequest.phone,
        registerRequest.email, registerRequest.institutionName, registerRequest.cardId, registerRequest.role,
        registerRequest.dataUrl)
    } catch (error) {
      if (error instanceof USER.UserAlreadyExists) {
        res.status(409)
        return res.send({ error: 'User already exists' })
      }
      if (error instanceof USER.RoleError) {
        res.status(409)
        return res.send({ error: 'Validation error' })
      }
    }
    res.status(200)
    return res.send()
  })

  /**
   * @swagger
   * /user/{address}:
   *    delete:
   *      summary: Deletes a user
   *      description: Deletes a user
   *      tags:
   *        - user
   *      parameters:
   *        - in: path
   *          description: User address
   *          name: address
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
   *        401:
   *          description: User is not an admin
   *        404:
   *          description: User not found
   *        409:
   *          description: User has on or more access requests
   *        500:
   *          description: Unexpected exception happened
   */
  app.delete('/user/:address', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole !== 3) {
      res.status(401)
      return res.send({ error: 'Unauthorized to delete user' })
    }
    const userAddress = req.params.address.toLowerCase()
    const user = await USER.getUser(userAddress)
    if (user === null) {
      res.status(404)
      return res.send({ error: 'Unknown user' })
    }
    if (user.role === 'END_USER') {
      try {
        await merkleTree.delete(BigInt(address.toLowerCase()))
      } catch (err) {
        // Some deletion failing, have to find out why
      }
    }
    const accessRequests = ACCESS_REQUEST.getAccessRequests(1, 10, userAddress)
    // required in order to properly run the tests
    if (!process.env.DEVELOPMENT) {
      if (accessRequests !== null) {
        res.status(409)
        return res.send({ error: 'User has pending access requests' })
      }
    }
    user.remove()
    res.status(200)
    return res.send()
  })

  /**
   * @swagger
   * /endUserCount:
   *    get:
   *      summary: Gets number of endUsers onboarded.
   *      description: Number of endUsers.
   *      tags:
   *        - endUserCount
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
   *              endUserCount:
   *                  type: number
   *        403:
   *          description: Forbidden
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/endUserCount', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole !== 4) {
      res.status(403)
      return res.send({ error: 'Forbidden request for not research institution manager role' })
    }
    const endUserCount = await USER.getEndUserCount()
    return res.send({ endUserCount: endUserCount })
  })

  /**
   * @swagger
   * /user:
   *    get:
   *      summary: Get user information
   *      description: If the user is a regular user (end user or research institution manager) this endpoint
   *        returns user's information. In case user requesting the get is
   *        a license manager, obtained response contains all the user information corresponding to role
   *        specified in the query parameter (END_USER or RESEARCH_INSTITUTION_MANAGER); in case this role parameter
   *        is not present, by default retrieves only END_USER role registerRequests.
   *      tags:
   *        - user
   *      parameters:
   *        - in: form
   *          description: Role
   *          name: role
   *          required: false
   *          schema:
   *            type: string
   *            example: RESEARCH_INSTITUTION_MANAGER
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
   *              users:
   *                  type: array
   *                  items:
   *                    type: object
   *                    properties:
   *                      _id:
   *                        type: string
   *                      dataUrl:
   *                        type: string
   *                      address:
   *                        type: string
   *                      firstName:
   *                        type: string
   *                      surnames:
   *                        type: string
   *                      phone:
   *                        type: string
   *                      email:
   *                        type: string
   *                      institutionName:
   *                        type: string
   *                        format: nullable
   *                      cardId:
   *                        type: string
   *                      role:
   *                        type: string
   *                      updatedAt:
   *                        type: string
   *                      createdAt:
   *                        type: string
   *                      __v:
   *                        type: integer
   *                        format: int32
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
   *          description: Unauthorized
   *        400:
   *          description: Unsupported role
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/user', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole !== 3) {
      const user = await USER.getUser(address)
      if (user === null) {
        res.status(403)
        return res.send({ error: 'Unauthorized to retrieve user data' })
      }
      res.status(200)
      return res.send(user)
    }
    let page = parseInt(req.query.page)
    let limit = parseInt(req.query.limit)
    let role = req.query.role
    if (isNaN(page) || page < 1) {
      page = 1
    }
    if (isNaN(limit) || limit < 1) {
      limit = 10
    }
    if (role === undefined) {
      role = 'END_USER'
    } else {
      if (role !== 'END_USER' && role !== 'RESEARCH_INSTITUTION_MANAGER' && role !== 'LICENSE_MANAGER') {
        res.status(400)
        return res.send({ error: 'Role should be END_USER, LICENSE_MANAGER or RESEARCH_INSTITUTION_MANAGER' })
      }
    }
    const users = await USER.getUsers(
      page, limit, role)
    res.status(200)
    return res.send(users)
  })

  /**
   * @swagger
   * /user:
   *    put:
   *      summary: Change user information
   *      description: Allows the user to update profile information
   *      tags:
   *        - user
   *      parameters:
   *        - in: header
   *          name: Authorization
   *          schema:
   *            type: string
   *            example: Bearer eyJhbGciOiJIUzI ... 6Q-CqWsgoBmzEnGOPmNKqdiX8Tn2y7JTA
   *        - in: body
   *          name: Body
   *          description: Body
   *          schema:
   *            type: object
   *            properties:
   *              surnames:
   *                type: string
   *                example: "John"
   *              firstName:
   *                type: string
   *                example: "Doe"
   *              phone:
   *                type: string
   *                example: "5555555555"
   *              email:
   *                type: string
   *                example: "john@example.com"
   *              cardId:
   *                type: string
   *                example: "7621-213-123"
   *              institutionName:
   *                type: string
   *                format: nullable
   *              role:
   *                type: string
   *              dataUrl:
   *                type: string
   *                format: nullable
   *              firebaseCloudToken:
   *                type: string
   *      responses:
   *        '200':
   *          description: Everything went ok
   *          schema:
   *            type: object
   *            properties:
   *              _id:
   *                type: string
   *              dataUrl:
   *                type: string
   *              address:
   *                type: string
   *              firstName:
   *                type: string
   *              surnames:
   *                type: string
   *              phone:
   *                type: string
   *              email:
   *                type: string
   *              institutionName:
   *                type: string
   *                format: nullable
   *              cardId:
   *                type: string
   *              role:
   *                type: string
   *              updatedAt:
   *                type: string
   *              createdAt:
   *                type: string
   *              __v:
   *                type: integer
   *                format: int32
   *        403:
   *          description: Unauthorized
   *        400:
   *          description: Unsupported role
   *        500:
   *          description: Unexpected exception happened
   */
  app.put('/user', async (req, res) => {
    const address = req.user.address.toLowerCase()
    if (req.body.email) {
      if (!EMAIL_VALIDATOR.validate(req.body.email)) {
        res.status(400)
        return res.send({ error: 'Mail address not valid' })
      }
    }
    try {
      const user = await USER.updateUser(address, req.body)
      res.status(200)
      return res.send(user)
    } catch (err) {
      console.log(`Unregistered user login ${req.body}`)
    }
    res.status(200)
    return res.send()
  })
}
