require('dotenv').config()

const REQUEST = require('../business/registerRequest.js')

const FS = require('fs')
const WEB3_API = require('web3')
const WEB3 = new WEB3_API(process.env.INFURA_HTTPS, null)
const ABI = JSON.parse(FS.readFileSync('./contracts/abi.json', 'utf-8'))
const CONTRACT = new WEB3.eth.Contract(ABI, process.env.CONTRACT_ADDRESS)
const EMAIL_VALIDATOR = require('email-validator')

module.exports = function (app) {
  /**
   * @swagger
   * /registerRequest:
   *    post:
   *      summary: Posts a register request.
   *      description: Endpoint that allows a endUser or a research institution manager to request access to the platform.
   *      tags:
   *        - registerRequest
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
   *        '200':
   *          description: Everything went ok.
   *          schema:
   *            type: object
   *            properties:
   *              _id:
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
   *              dataUrl:
   *                type: string
   *              firebaseCloudToken:
   *                type: string
   *              updatedAt:
   *                type: string
   *              createdAt:
   *                type: string
   *              __v:
   *                type: integer
   *                format: int32
   *        409:
   *          description: User already performed a register request
   *        400:
   *          description: Not supported role
   *        500:
   *          description: Unexpected exception happened.
   */
  app.post('/registerRequest', async (req, res) => {
    const alreadyIn = await REQUEST.getRegisterRequest(req.user.address.toLowerCase())
    if (alreadyIn !== null) {
      res.status(409)
      return res.send({ error: 'Request already sent' })
    }
    const address = req.user.address.toLowerCase()
    const firstName = req.body.firstName
    const surnames = req.body.surnames
    const phone = req.body.phone
    const email = req.body.email
    if (!EMAIL_VALIDATOR.validate(email)) {
      res.status(400)
      return res.send({ error: 'Mail address not valid' })
    }
    const institutionName = req.body.institutionName
    const cardId = req.body.cardId
    const role = req.body.role
    const dataUrl = req.body.dataUrl
    const firebaseCloudToken = req.body.firebaseCloudToken
    try {
      await REQUEST.createRegisterRequest(
        address,
        firstName,
        surnames,
        phone,
        email,
        institutionName,
        cardId,
        role,
        dataUrl,
        firebaseCloudToken
      )
    } catch (error) {
      if (error instanceof REQUEST.RequestAlreadySent) {
        res.status(400)
        return res.send({ error: error.message })
      }
      if (error instanceof REQUEST.RoleError) {
        res.status(400)
        return res.send({ error: error.message })
      }
      res.status(500)
      return res.send({ error: error.message })
    }
    res.status(200)
    return res.send(await REQUEST.getRegisterRequest(address))
  })

  /**
   * @swagger
   * /registerRequest:
   *    delete:
   *      summary: Deletes an access request.
   *      description: Allows a user to delete his/her register request on the system; also allows
   *        the license administrator to delete register requests from users that do not match
   *        elegibility criteria. User should delete her/his register request without including
   *        the path parameter address (since address is contained in the JWT required for authorization
   *        purposes). Administrator has to provide the path parameter corresponding to the
   *        address of the user's register request to delete.
   *      tags:
   *        - registerRequest
   *      parameters:
   *        - in: path
   *          description: User address (required in case invokation comes from an admin)
   *          name: address
   *          required: false
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
   *          description: User is neither an admin
   *        500:
   *          description: Unexpected exception happened
   */
  app.delete('/registerRequest/:address', async (req, res) => {
    const addressToDelete = req.params.address.toLowerCase()
    const address = req.user.address.toLowerCase()
    const registerRequest = await REQUEST.getRegisterRequest(addressToDelete)
    if (registerRequest === null) {
      res.status(404)
      return res.send({ error: 'Address not found' })
    }
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole === 3) {
      // Admin can delete register requests
      registerRequest.remove()
      res.status(200)
      return res.send()
    }
    if (registerRequest.address !== address) {
      res.status(401)
      return res.send({ error: 'Unauthorized to delete account' })
    }
    // Allowing the user to delete his/her register request
    registerRequest.remove()
    res.status(200)
    return res.send()
  })

  /**
   * @swagger
   * /registerRequest:
   *    get:
   *      summary: Gets register requests
   *      description: If the user is a regular user (end user or research institution manager) this endpoint
   *        returns user's information in case a previous register request was performed or a 204 status code
   *        signaling user has not already performed a register request. In case user requesting the get is
   *        a license manager, obtained response contains all the pending register requests corresponding to role
   *        specified in the query parameter (END_USER or RESEARCH_INSTITUTION_MANAGER); in case this role parameter
   *        is not present, by default retrieves only END_USER role registerRequests.
   *      tags:
   *        - registerRequest
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
   *              registerRequests:
   *                  type: array
   *                  items:
   *                    type: object
   *                    properties:
   *                      _id:
   *                        type: string
   *                      address:
   *                        type: string
   *                      dataUrl:
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
   *        204:
   *          description: Register request not found for your address
   *        400:
   *          description: Unsupported role
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/registerRequest', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (parseInt(addressRole) !== 3) {
      const registerRequest = await REQUEST.getRegisterRequest(address)
      if (registerRequest === null) {
        res.status(204)
        // User has not performed a register request yet
        return res.send({
          error: 'Register request not found for your address'
        })
      }
      res.status(200)
      // User has performed a register request
      return res.send(registerRequest)
    }
    // Beyond this point only role = 3 (license administrator)
    let page = parseInt(req.query.page)
    let limit = parseInt(req.query.limit)
    let role = req.query.role
    if (isNaN(page) || page < 1) {
      page = 1
    }
    if (isNaN(limit) || limit < 1) {
      limit = 100
    }
    if (role === undefined) {
      // No explicit role defined, getting
      role = 'END_USER'
    } else {
      if (
        role !== 'END_USER' &&
        role !== 'RESEARCH_INSTITUTION_MANAGER' &&
        role !== 'LICENSE_MANAGER'
      ) {
        res.status(400)
        return res.send({
          error:
            'Role should be END_USER, LICENSE_MANAGER or RESEARCH_INSTITUTION_MANAGER'
        })
      }
    }
    const registerRequests = await REQUEST.getRegisterRequests(
      page,
      limit,
      role
    )
    res.status(200)
    return res.send(registerRequests)
  })

  /**
   * @swagger
   * /registerRequest/{address}:
   *    put:
   *      summary: Allows a license manager to onboard a user into the platorm.
   *      tags:
   *        - registerRequest
   *      parameters:
   *        - in: path
   *          description: New user address
   *          name: address
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
   *              pendingBC:
   *                type: boolean
   *                example: true
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
   *          description: Caller is not a license administrator therefore cannot onboard new users
   *        500:
   *          description: Unexpected exception happened.
   */
  app.put('/registerRequest/:address', async (req, res) => {
    const address = req.user.address.toLowerCase()
    const userAddress = req.params.address.toLowerCase()
    const addressRole = await CONTRACT.methods.userRoles(address).call()
    if (addressRole !== 3) {
      res.status(403)
      return res.send({
        error: 'Only administrators can accept register requests (register users)'
      })
    }
    if (req.body.pendingBC) {
      try {
        await REQUEST.manageBCRegisterRequest(userAddress)
      } catch (error) {
        res.status(200)
        return res.send()
      }
    }
    res.status(200)
    return res.send()
  })
}
