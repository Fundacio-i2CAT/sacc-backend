## Deployment

### Pre-requirements

- nodeenv
- MongoDB: [Installation on Ubuntu](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### Smart contract deployment

First copy the sample environment to your environment.
Edit this .env file in order to match your needs and **include some 12 word mnemonic**.:
```
$ cp .env.sample .env
```

Then, configure your environment:
```
$ nodeenv --node 10.15.1 venv
$ source venv/bin/activate
(venv) $ npm install
```

In a terminal or byobu pane:
```
(venv) $ npx ganache-cli --mnemonic '<twelve word mnemonic space separated>'
```

Twelve word mnemonic should match the .env configured mnemonic.


After that in another pane:
```
(venv) $ node utils/deploy.js
```

this will compile the contract under contracts directory, output
its ABI to contracts directory under contracts/abi.json and update
.env file to point to current deployment contract address.
