require('dotenv').config()

const TOPIC = require('../schemas/topic.js')

const getTopics = async function () {
  const topics = await TOPIC.getTopics()
  return topics
}

const incrementTopics = async function (topicNames) {
  topicNames.forEach(async e => TOPIC.incrementTopic(e))
}

module.exports = {
  getTopics: getTopics,
  incrementTopics: incrementTopics
}
