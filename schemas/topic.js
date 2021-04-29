const MONGOOSE = require('mongoose').set('useCreateIndex', true)

const SCHEMA = MONGOOSE.Schema

class DuplicatedIndex extends Error {}
class ValidationError extends Error {}

const TOPIC_SCHEMA = new SCHEMA({
  address: { type: String, unique: true },
  title: String,
  description: String,
  userCount: { type: Number, default: 0 }
})

const TOPIC = MONGOOSE.model('Topic', TOPIC_SCHEMA)

const getTopics = async function () {
  const limit = await getTopicCount()
  console.log(limit)
  return TOPIC.find()
}

const getTopicCount = async function () {
  const count = await TOPIC.countDocuments()
  return count
}

const newTopic = async function (
  address, title, description) {
  try {
    const object = {
      address: address,
      title: title,
      description: description
    }
    const model = await TOPIC.create(object)
    return model.id
  } catch (error) {
    if (error.code === 11000) {
      throw new DuplicatedIndex()
    }
    if (error.name === 'ValidationError') {
      throw new ValidationError()
    }
    throw new Error('Unexpected error')
  }
}

const incrementTopic = async function (topicName) {
  const topic = await TOPIC.findOne({ title: topicName })
  if (topic !== null) {
    const updatedUserCount = topic.userCount + 1
    await TOPIC.updateOne({ title: topicName }, { $set: { userCount: updatedUserCount } })
  }
}

module.exports = {
  Topic: TOPIC,
  newTopic: newTopic,
  getTopics: getTopics,
  incrementTopic: incrementTopic
}
