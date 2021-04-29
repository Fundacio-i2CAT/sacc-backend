const TOPIC = require('./../schemas/topic.js')
const ETHEREUM_WALLET = require('ethereumjs-wallet')

const TOPICS = [
  { title: 'Saturació oxígen',
    description: 'Saturació oxígen',
    address: ETHEREUM_WALLET.generate().getAddressString()
  },
  { title: 'Pressió sanguínia',
    description: 'Pressió sanguínia',
    address: ETHEREUM_WALLET.generate().getAddressString()
  },
  { title: 'Passes caminades',
    description: 'Passes caminades',
    address: ETHEREUM_WALLET.generate().getAddressString()
  },
  { title: 'Hipertensió',
    description: 'Tensió alta',
    address: ETHEREUM_WALLET.generate().getAddressString()
  }
]

module.exports = async function () {
  TOPICS.map((x) => {
    TOPIC.newTopic(x.address, x.title, x.description)
  })
}
