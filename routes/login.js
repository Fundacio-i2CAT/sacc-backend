const LOGIN = require('../business/login.js')

module.exports = function (app) {
  /**
   * @swagger
   * /login:
   *    post:
   *      summary: Login endpoint POST method.
   *      description: First call requires the address and provides a challenge to sign; second call requires
   *        the previously sent address with the signed challenge and in case key recovery matches address
   *        returns a JWT containing the same address and an expiration time.
   *      tags:
   *        - login
   *      parameters:
   *        - in: header
   *          name: Content-Type
   *          schema:
   *            type: string
   *            example: application/json
   *        - in: body
   *          description: Body
   *          name: Body
   *          schema:
   *            type: object
   *            properties:
   *              address:
   *                type: string
   *                example: "0x6Ee638fbA5908354fcE7705aB5B887629894fE16"
   *              signature:
   *                type: string
   *                example: "0x9a4202db408a0b85f90cd26573503a6cfc127b4c525735417e6eb3d570a24ddd145c3893c5820f1983b9cfcadb42b1f65f6eddbfb4f7877d9095e4682fbcc7611c"
   *      responses:
   *        200:
   *          description: Everything went ok.
   *          schema:
   *            type: object
   *            properties:
   *              address:
   *                type: string
   *                example: "0x6Ee638fbA5908354fcE7705aB5B887629894fE16"
   *              accessToken:
   *                type: string
   *                example: "eyJhbGciOiJIUzI1NiIs..................QqscCp4wAo0C67kdL"
   *        403:
   *          description: User is not a research institution manager and since is not allowed to request access.
   *        500:
   *          description: Unexpected exception happened.
   */
  app.post('/login', async (req, res) => {
    if (req.body['signature'] === undefined) {
      const address = req.body.address
      return res.send({ challenge: await LOGIN.generateChallenge(address) })
    }
    const address = req.body.address
    try {
      let token
      if (typeof req.body.signature === 'string') {
        token = await LOGIN.checkSignature(req.body.signature, req.body.address)
      } else {
        token = await LOGIN.validate(address, req.body.signature)
      }
      return res.send(token)
    } catch (error) {
      res.status(401)
      return res.send({ error: error })
    }
  })
}
