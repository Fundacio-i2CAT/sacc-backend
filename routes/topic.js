require('dotenv').config()

const TOPIC = require('../business/topic.js')

module.exports = function (app, merkleTree) {
  /**
   * @swagger
   * /topic:
   *    get:
   *      summary: Get currently registered topics
   *      description: Can be any user
   *      tags:
   *        - topic
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
   *              topics:
   *                  type: array
   *                  items:
   *                    type: object
   *                    properties:
   *                      _id:
   *                        type: string
   *                      address:
   *                        type: string
   *                      title:
   *                        type: string
   *                      description:
   *                        type: string
   *                      __v:
   *                        type: integer
   *                        format: int32
   *        403:
   *          description: Unauthorized
   *        400:
   *          description: Unsupported role
   *        500:
   *          description: Unexpected exception happened
   */
  app.get('/topic', async (req, res) => {
    const topics = await TOPIC.getTopics()
    res.status(200)
    return res.send({ topics: topics })
  })
  /**
   * @swagger
   * /topic:
   *    post:
   *      summary: Post ZK proof of a topic
   *      description: Only end users
   *      tags:
   *        - topic
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
   *              topics:
   *                  type: array
   *                  items:
   *                    type: object
   *                    properties:
   *                      _id:
   *                        type: string
   *                      address:
   *                        type: string
   *                      title:
   *                        type: string
   *                      description:
   *                        type: string
   *                      __v:
   *                        type: integer
   *                        format: int32
   *        403:
   *          description: Unauthorized
   *        400:
   *          description: Unsupported role
   *        500:
   *          description: Unexpected exception happened
   */
  app.post('/topic', async (req, res) => {
    await TOPIC.incrementTopics(req.body.topicNames)
    res.status(200)
    return res.send({ topics: req.body.topicNames })
  })
}
