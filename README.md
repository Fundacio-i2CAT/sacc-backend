# Sacc backend

## About this document

*This document contains technical documentation
regarding the software developed by i2CAT Software Engineering Group
team as a Proof of Concept consisting in data
donation using the blockchain as immutable and unique
source of trust and decentralization. After a brief introducion
about the goals of the project and supported features,
user roles description, architecture overview, deployment
instructions (*both over a Go Ethereum node and development
focused deployment over Ganache CLI*), detailed
work-flow description, quality assurance notes,
secutiry considerations and includes indications for integrating
the software with the mobile app.*

## Disclaimer

All private keys, mnemonics and passwords used in this document
as examples, should not be used apart from demo/development purposes.

## Development team

- [Sergi Sólvez](https://github.com/ssolves) -> Front-end reviewer, components layout and UX.
- [Santi López Amate](https://www.linkedin.com/in/santiago-lopez-amate-6a9936a4/)
-> Smart contract, back-end, front-end and quality.
- [Alfonso Egio](https://github.com/alfonsoegio)
-> Back-end, devops, quality and documentation.
- [Mateo Hermosilla López](https://www.linkedin.com/in/mateo-hermosilla-lopez/) -> Scrum Master.
- [Belén Pousa Fernández](https://www.linkedin.com/in/bel%C3%A9n-pousa-fern%C3%A1ndez-61a296157)
-> Quality Assurance.

## Introduction

Main idea behind Blockchain Health Data Application consists
on giving citizens the ability to share their own bio-medical data records
with research institutions; first proof of concept was focused in
the consent of this data access donation under Salus CG License
(*Salus Common Good Data License for Health Research*) including
this statements:

1) **Only health**: Data will be used for research of chronic and/or rare
diseases.

2) **Non-commercial**: Research projects will be promoted for
general interest entities like public institutions, universities
and foundations.

3) **Shared Results**: All research assets and results will be
cost-free accessible.

4) **Maximum Privacy**: All data will be anonymized and unidentified
before any exploitation.

5) **Total Control**: Users can cancel or modify access condition to
their data in any time.

## Feature overview

All the software described in this document aims to fulfill
[Salus Coop](https://www.saluscoop.org/) requirements regarding
a hybrid centralized/decentralized application supporting
the following features:

- Public key authentication schema.
- Public key role-based authorization schema.
- Immutable blockchain-based accountability.
- Public key signature schema in order to publicly consent and revoke data access.
- End to end secret transmission between users and research institutions (*confidential data sharing*).

## Roles

All the users of the platform (*even not-yet registered ones*)
have a role assigned in the execution context of HDA smart contract
described below:

- **HDA Contract Owner**: Since the smart contract inherits from
[Open Zeppelin's Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.0.0-rc.1/contracts/ownership/Ownable.sol)
the developer that deploys the contract into the Ethereum blockchain
becomes the owner of the contract. Being a contract owner is a pre-requirement
to assign another user the License Manager role (see below). That action
(assigning License Manager roles) is the only action that the owner
can perform against the contract apart from owner's normal attributions
regarding transferring his/her ownership or renounce to it transferring
it to the unrecoverable 0x0 address.

- **License Manager**: This role corresponds to users that are going to manage the on-boarding
of end users or research institution managers. Attributions
for this role consist on having access to two pending register requests lists
corresponding to end users willing to donate their data, and research institution
managers. License manager, will have access to some information regarding
both kinds of register requests in order to go through some kind of Know
Your Customer procedure in order to give a guarantee about the identity
of the accepted users.

- **Unregistered User**: Any user not-yet registered that access the front-end portal having an
Ethereum private key. Users with this role can fill a register request
through the front-end form in order to notify a License Manager their
commitment to on-board the system.

- **End User**: Role corresponding to users that want to be able to recieve
data access requests in order to consent or not research institution
managers to have access to their data according to the license terms.

- **Research Institution Manager** User role being able to check number of end users on-boarded on the
platform and request access to their bio-medical records.

## Frameworks & architecture

This section contains an overall description of the different technologies
and building blocks of the solution.

### Blockchain

Blockchain flavor chosen to support the smart contract operation
is [Ethereum](https://github.com/ethereumbook/ethereumbook). Main reasons
to choose Ethereum over other Distributed Ledger Technology (DLT) solutions:

- Still evolving but mature technology staked by approximately 20,000 M€.
- Largest blockchain (*user number and main net stake*) supporting Turing complete smart contracts.
- Largest developer community.
- Ability to be deployed on a public network (main or testnets).
- Ability to be deployed as an ad-hoc permisioned network.

For the proof of concept we used [Ganache CLI](https://github.com/trufflesuite/ganache-cli)
for development and testing purposes
and a private ad-hoc single node Go Ethereum blockchain deployed on the same virtual
machine where the back-end and front-end are served.

### Smart Contract

Solidity implementation of an Open Zeppelin *Ownable* inherited contract
holding mappings to register user roles.

### Back-end

In order to support the work-flows going on off-chain, we built a REST
API implementation in [NodeJS](https://nodejs.org/en/)
using [Express](https://expressjs.com/) as web framework and [mongoose](https://mongoosejs.com)
as object relational mapping library.

### Front-end

Based on [https://reactjs.org](React) using MetaMask plugin as wallet to manage private keys
and signatures.

Although front-end serves as a Proof of Concept to validate work-flows; it should
be considered as a starting point in order to proceed building mobile applications.
Take into account that there are some caveats regarding usage of this front implementation
with real users in a production system:

- Front-end relies on [MetaMask](https://github.com/MetaMask/metamask-extension) to inject
user's personal wallets into the application. This has some adoption issues since
the user have to install this plugin in order to access the application in a regular browser.

- End to end secret confidential messaging; although front-end does not
send plain secret messages to the back-end (back-end only receives encrypted secrets
with the public key of the receiver) and the encryption procedure runs fully on user's
own machine; neither front-end code and its dependencies have been audited regarding
cross site scripting (XSS) that eventually can lead to vulnerabilities causing secret information
leaks.

## Go Ethereum deployment

Next subsections contain deployment instructions; these instructions have been tested
against an Ubuntu 16.04 LTS Linux distribution.

### Blockchain node

In order to start a private local node, first [install Go Ethereum](https://github.com/ethereum/go-ethereum/wiki/Installing-Geth)
(*tested with version 1.8.27-stable-4bcc0a37*); after doing that, create a directory
to hold blockchain data called `geth` and navigate to it:

```
$ mkdir geth
$ cd geth
```

After that, create a genesis block specification generating a new file called `init.json`
containing the following JSON, but replacing `<chain_id>` for an integer of your choice
(excluding from this choice numbers corresponding to public networks - see note below):

```
{
  "config": {
    "chainId": <chain_id>,
    "homesteadBlock": 0,
    "eip155Block": 0,
    "eip158Block": 0
  },

  "alloc"      : {},
  "coinbase"   : "0x0000000000000000000000000000000000000000",
  "difficulty" : "2",
  "gasLimit"   : "10000000",
  "extraData"  : "",
  "nonce"      : "0x0000000000000042",
  "mixhash"    : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "parentHash" : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "timestamp"  : "0x00"
}
```

**NOTE**: Avoid using reserved public chain ids:

- 1: Ethereum mainnet
- 2: Morden (disused), Expanse mainnet
- 3: Ropsten
- 4: Rinkeby
- 5: Goerli
- 42: Kovan

Once the file is in place, create directory `data` inside `geth` directory and invoke
`geth` to generate the genesis block into it:

```
$ mkdir data
$ geth --datadir ./data init init.json
```

Now, install MetaMask plugin in a compatible browser such as Firefox or Chrome;
let MetaMask generate a secret random
[BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic
(*or import your mnemonic of choice in case you have one already*) and
keep a paper backup of it in a safe place.

In order to retrieve different private keys from the mnemonic, install
[Ganache-CLI](https://www.npmjs.com/package/ganache-cli) and run the command replacing
using the sample mnemonic provided:

```
$ ganache-cli --mnemonic 'code super common cruise creek source police mistake fox twist brick ivory' -h 0.0.0.0 -g 0 -a 10
```

**CAUTION: Do not use this mnemonic (*`code super ...`*) in a production environment.**

The output from this command contains first 10 private keys derived from the mnemonic:

```
Private Keys
==================
(0) 0xcf97058df847422f1f19421f755029c6cfb11bf29096fbc2ece26d491331a027
(1) 0x03cf6bb9eddca4696c623bc2c103026b54e64926d9649ff39d5a357e7dcf0d65
(2) 0x69664558b54f03c31cc7dc4f299df9b81a178551ec03c70a7df073b977dde160
(3) 0x971f3f0686c1b1a92f0d8b8067b60d18c6d8a2279382c2759f5f1798728aa50f
(4) 0xf326a63b5274abc51fcd936e4225428f83969c92e057f77dbc06ae538e9f8064
(5) 0xaed47bc43727b3f1a051578456c33e75394f3c8af04bdbadb575a3c225848b5a
(6) 0x552dd9ff9241f28acfe7dcef932dcaf0914c70b9fc2cf2d2d65408d806b7d56c
(7) 0x6239c93308359f700b1981476b46427085af3323ed776e6942b69434c8dff710
(8) 0x0adf52df10a277981385afe3dd2a5a29c78d796915e8d389d688acbf9a9152fa
(9) 0x643d73fde96ec8d51634e705bb299c11ffe9d68cd2126650f34bbf89e7512008
```

**CAUTION: Do not use these private keys in a production environment.**

After generating genesis block, add a coin base account to the geth client
(*this account is going to keep rewards of mined blocks*); in order to do this
generate an Ethereum private key or export it from a wallet (*Representation required is
32 byte hexadecimal encoding removing the leading
0x from the Ganache output representation*), for example:

```
cf97058df847422f1f19421f755029c6cfb11bf29096fbc2ece26d491331a027
```

**CAUTION: Do not use this private key in a production environment.**

and append it to a new file:

```
$ echo 'cf97058df847422f1f19421f755029c6cfb11bf29096fbc2ece26d491331a027' >> coinBasePrivateKey.prv
```

After that import it to Go Ethereum using following command:

```
$ geth account import --datadir ./data ./coinBasePrivateKey.prv
```

geth will request a password in order to encrypt your private key in a file
inside `data/keystore/` directory.

After that start the blockchain with the following command replacing `<host_ip_address>`
by the public ip address of the host system:

```
$ geth --ws --wsport 8546 --wsaddr <host_ip_address> 8545 --rpc --rpcaddr <host_ip_address> --rpccorsdomain "*" --datadir ./data console --rpcapi="db,eth,net,web3,personal,web3" --wsorigins="*"
```

Once started, previous command will lead to a Go Ethereum console where we can start the
mining process on one thread for example:

```
> miner.start(1)
```
### Smart Contract

Full code of the smart contract including [Ownable v1.12.0](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v1.12.0-rc.2/contracts/ownership/Ownable.sol)
is included below.

```
pragma solidity 0.5.11;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () public {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     * @notice Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}



contract HDA is Ownable {
    enum Roles {notRegistered, endUser, doctor, licenseManager, researchInstitutionManager}

    mapping(address => Roles) public userRoles;

    event GrantedAccessUser(address indexed userRequester, Roles indexed roleRequested);

    mapping(address => mapping(address => bool)) public permissionsAllowedFromUser;

    event GrantedAccessToInstitution(address institutionRequester, address indexed userRequested);
    event RevokedAccessToInstitution(address institutionRequester, address indexed userRequested);

    function setUserRole(address _user, Roles _role) public {
        if(_role == Roles.licenseManager) {
            require(isOwner(), "Only contract owner can create License Managers");
        } else {
            require(userRoles[msg.sender] == Roles.licenseManager,
                    "Only License Managers can create End Users, Doctors and Research Institution Managers");
        }

        userRoles[_user] = _role;

        emit GrantedAccessUser(_user, _role);
    }

    function grantPermissionToInstitution(address _requester) public {
        require(userRoles[msg.sender] == Roles.endUser, "Only End Users can grant access to their data");
        require(userRoles[_requester] == Roles.researchInstitutionManager,
                "Access can only be granted to Research Institution Managers");

        permissionsAllowedFromUser[msg.sender][_requester] = true;

        emit GrantedAccessToInstitution(_requester, msg.sender);
    }

    function revokePermissionToInstitution(address _requester) public {
        require(userRoles[msg.sender] == Roles.endUser, "Only End Users can revoke access to their data");
        require(permissionsAllowedFromUser[msg.sender][_requester] == true,
                "Access can only be revoked to Research Institution Managers that had it granted");

        permissionsAllowedFromUser[msg.sender][_requester] = false;

        emit RevokedAccessToInstitution(_requester, msg.sender);
    }
}
```

In order to deploy it, use the same browser where MetaMask was installed using the same mnemonic
producing the first keypair added to the Go Ethereum node, pointing it to the Custom RPC
network with URL `http://<host_ip_address>:8545`
and include as `ChainID` the `<chain_id>`number used in genesis block spec (`init.json`).

After that, navigate to [Remix](http://remix.ethereum.org); select the 'Deploy & run transactions' menu
and set as environment 'Injected Web3'; MetaMask will then ask you for confirmation to grant permision
to the Remix web application. Once this is done, create a new file in files menu and just copy and paste
already provided smart contract source code. Navigate to 'Solidity compiler' menu, compile it contract
using 0.5.11 compiler version and return to 'Deploy & run transactions menu', select HDA contract
and deploy it.

Once the contract is deployed over our private Ethereum node, add an additional account to MetaMask,
copy its public address and switch again to first account (corresponding to contract deployer and
owner). Then invoke the `setUserRole` method using public address of the second account as first parameter
and the number `3` (*license manager*) as second parameter using Remix contract interface form.

**Note:** Since roles are codified as a Solidity enum, taking into account this line of code:

```
    enum Roles {notRegistered, endUser, doctor, licenseManager, researchInstitutionManager}
```

- 0: notRegistered
- 1: endUser
- 2: doctor (*not used*)
- 3: licenseManager
- 4: researchInstitutionManager

### Back-end

#### Install MongoDB

Tested against [MongoDB v2.6.10](https://docs.mongodb.com/manual/installation/).

**CAUTION:** By default MongoDB does not require authentication, since there and for security
reasons does not listen to outside world connections; but double check this is true in your
particular deployment looking at `/etc/mongodb.conf` checking a line stating
`bind_ip = 127.0.0.1`. Anyway it's recommended to setup a firewall or include
the machine in a security group only allowing connection over required ports
described in the 'Required port connectivity' section below.

#### Seting up Node.js environment

To avoid polluting system wide Node.js and using the same Node.js
version used through the development process recommended
setup relies on [Node.js virtual environment](https://github.com/ekalinin/nodeenv);
to install it just use the command:

```
$ sudo pip install nodeenv
```

After that move to directory where backend repository was cloned (for example `~/hda/backend`)
and create a Node.js local virtual environment, activate it and install project dependencies:

```
$ cd ~/hda/backend
$ nodeenv --node 10.15.1 venv
$ source venv/bin/activate
(venv) $ npm install
```

#### Back-end configuration and deployment

Copy environment configuration file from `.env.sample` to `.env` and edit its values
to match your server configuration (**see explanation below**):

- `PORT`: Used in order to serve the HTTP API.
- `DEVELOPMENT`: true or false (only used for testing purposes).
- `SECRET`: Secret keyword used to sign the authentication JSON Web Tokens (JWT).
- `JWT_EXPIRATION_TIME`: user session (*after login*) expiration time in ms.
- `MNEMONIC`: Used for testing purposes.
- `GANACHE_PORT`: Pointing to the Ethereum HTTP RPC port.
- `WS_PORT`: Pointing to the Ethereum Web Sockets port.
- `CONTRACT_PATH`: pointing to `../contracts`, leave it unaltered.
- `CONTRACT_ADDRESS`: copy from Remix or geth mining console the contract address and replace
`undefined` with it
- `GETH_IP_ADDRESS`: `<host_ip_address>` used in geth deployment.
- `GETH_MAIN_PASSWORD`: Only used for testing.
- `SERVER_ADDRESS`: Can leave it unaltered pointing to `127.0.0.1` (*localhost*).

Once the back-end is properly configured it can be started using the command:

```
(venv) $ node index.js
```

**NOTE**: Recommended deployment of the back-end on Go Ethereum should be improved
using a module like [forever](https://www.npmjs.com/package/forever) or
[PM2](http://pm2.keymetrics.io/).

### Front-end

#### Install NGINX

Front-end React Single Page Application recommended server:

```
sudo apt-get -y install nginx
```


#### Frornt-end production build

On another terminal navigate to the front-end repository directory (*for example* `~/hda/frontend`),
setup another Node.js virtual environment and build the production Single Page Application (SPA):

```
$ cd ~/hda/frontend
$ nodeenv --node 10.15.1 venv
$ source venv/bin/activate
(venv) $ npm install
```
Once this step completes, copy the sample configuration file `.env.production.sample`
and edit it to match your configuration (basically `REACT_APP_CONTRACT_ADDRESS`
and `REACT_APP_BACKEND_DOMAIN` leaving all the other parameters unaltered):

```
REACT_APP_CONTRACT_ADDRESS=0x41B301c0b0AbbFEef99803c23A281712e29B6EF1
REACT_APP_BACKEND_PORT=443
REACT_APP_BACKEND_PROTOCOL=https
REACT_APP_BACKEND_PATH=/api
REACT_APP_BACKEND_DOMAIN=blockchain-hda.i2cat.net
```

Last step to build the Single Page Application consists on running the command:

```
(venv) $ npm run build
```

After that create a directory under `/var/www/html/`, copy `build` folder contents into it
and grant read access to everybody:

```
(venv) $ sudo mkdir /var/www/html/frontend
(venv) $ sudo cp -r build/* /var/www/html/frontend/
(venv) $ sudo chmod -R a+r /var/www/html/frontend/
```

Now edit NGINX `/etc/nginx/snakeoil.conf` to point to your SSL certificate
and key (*see example below*):

```
ssl_certificate /etc/ssl/certs/certificate.pem;
ssl_certificate_key /etc/ssl/private/privateKey.key;
```

Once this is done, edit NGINX configuration file `/etc/nginx/sites-available/default`
to configure it like this:

```
# Redirects 80 requests to 443
server {
       listen 80 default_server;
       listen [::]:80 default_server;
       server_name _;
       return 301 https://$host$request_uri;
}

# Main https listener
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    include snippets/snakeoil.conf;
    root /var/www/html/frontend;
    index index.html index.htm index.nginx-debian.html;

    server_name blockchain-hda.i2cat.net;

    # Back-end reverse proxy to Express server on 3001
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
    }
}
```

After completing last steps, restart nginx:

```
$ sudo systemctl restart nginx
```
### Required port connectivity

Ensure the firewall/s of the host system of the system allow traffic
through TCP-IP ports:

- 80
- 443
- 8445
- 8446

## System readiness

At this point:

- First generated account according to the mnemonic derivation used corresponds to contract owner.
- This first account is also the coinbase of our private Ethereum node; every mined block should
increase its balance.
- Second account generated from the mnemonic has assigned role 3 - licenseManager and therefore
can onboard new users to the system accepting their register requests.
- The system is ready to be used and start receiving register request either from end users and
research institution managers; once the license manager accepts the on-boarding of new users,
they can start operating over the platform requesting and consenting access to the data.

## Development deployment

This section describes how to deploy the project for testing & development purposes
using [Ganache CLI](https://github.com/trufflesuite/ganache-cli) RPC client in order
to emulate locally an Ethereum node.

Take into account that every signature and transaction produced and broadcasted by
MetaMask over the RPC has a nonce associated with the account; so in case you restart
your Ganache instance and deploy the contract again, you should reset your MetaMask
plugin over all available accounts since it's very likely that new transaction have
greater nonce associated and wont't achieve being mined.

### Ganache instance

Dependencies related to smart contract deployment are contained in the back-end
repository; navigate to its root folder (*for example* `~/hda/backend`), activate
virtual environment and install all dependencies using `npm`:

```
$ cd ~/hda/backend
$ nodeenv --node 10.15.1 venv
$ source venv/bin/activate
(venv) $ npm install
```

With node dependencies on place, execute ganache-cli:

```
(venv) $ npx ganache-cli --mnemonic 'code super common cruise creek source police mistake fox twist brick ivory' -h 0.0.0.0 -g 0 -a 10
```
### Smart contract over Ganache

In another terminal or [Byobu](http://byobu.co/) pane execute:

```
$ cp .env.sample .env
$ #
$ # edit .env as described in previous section (use the same mnemonic as in ganache-cli invokation)
$ #
$ source venv/bin/activate
(venv) $ node utils/deploy.js
Smart contract address: 0x41B301c0b0AbbFEef99803c23A281712e29B6EF1
Owner: 6Ee638fbA5908354fcE7705aB5B887629894fE16 granting license manager
role on 0x6F5F36f448C2932AAd5D62a14E14F85b756BC9BC
```

This will deploy the smart contracts to the ganache-cli instance from the
first mnemonic derived account, and assign license manager role to the second one;
after that, the back-end can be deployed running the following command:

### Back-end

```
(venv) $ node index.js
Blockchain-HDA back-end listening on port 3001!
```
Once back-end is running you can check a [Swagger](https://swagger.io/) live documentation
page available at the URL: [http://localhost:3001/api-docs/#/](http://localhost:3001/api-docs/#/).

### Front-end

Once one has the contract deployed over Ganache and back-end running; navigate to the front-end folder:

```
$ cd ~/hda/frontend
$ source venv/bin/activate
(venv) $ npm install
```

And copy the `.env.development.sample`, edit it replacing `REACT_APP_CONTRACT_ADDRESS`
to the contract address echoed by the console of the deployment script (*in our example*):

```
REACT_APP_CONTRACT_ADDRESS=0x41B301c0b0AbbFEef99803c23A281712e29B6EF1
```

Once development configuration is updated, execute:

```
(venv) $ npm run start
```

This will open your default browser and direct it to `http://localhost:3000` where
the front-end SPA is being served.

*NOTE*: Don't forget to configure MetaMask plugin to use the pre-defined network **Localhost 8545**.

## Development system readiness

As with system Go Ethereum deployment, now we have prepared a light local
functional deployment over Ganache for development purposes.

## Work-flows

This section contains a description of all the workflows and endpoints
supported by the software; describing front-back flows and smart-contract calls
and listeners including example payloads. All calls to the back-end should
include an accept header for `application/json` and apart from `/login` and
`/api-docs` endpoints an additional authorization HTTP header containing user's
session JSON Web Token (*see next subsection for details*).

### One-click user login, authentication and authorization using JWT

Once a user clicks the button to log into the system, the front-end
performs a first HTTP POST request to the backend endpoint `/login`
containing as payload the public address of the currently active MetaMask
account:

```
{address: "0x6ee638fba5908354fce7705ab5b887629894fe16"}
```

Response from this first call from the back-end contains a challenge
(concatenation of user address and current timestamp):

```
{"challenge":"0x6ee638fba5908354fce7705ab5b887629894fe161568882661353"}
```

Then, in order to successful login to the system, front-end should make a
second HTTP POST request to the `/login` back-end endpoint containing
a digital signature of the challenge causing MetaMask to open a popup
in order the user to consent MetaMask performing the signature;
front-end payload to back-end in this second call in this case
looks like example below:

```
{
  address: "0x6ee638fba5908354fce7705ab5b887629894fe16",
  signature: "0x62dc6d63f50125e542b645aa7136de265f4966c0cd4e91a8378711f5b80058a97ad38f53e5c8cebe4f7f790d0c0723fe08662199bb2421eeeb0765833d4ab25a1c"
}
```
Signature is computed in the plugin via invocation of MetaMask
[Web3](https://github.com/ethereum/web3.js/) (see sample source below):

```
const signature = await web3.eth.sign(
  web3.utils.keccak256(challenge.data.challenge),
  accounts[0]
);
```

Then, the back-end will validate that the challenge was properly signed
checking that the public key recovered from the signature matches the announced
address; in case it matches, generates a JSON Web Token [JWT](https://jwt.io/) containing
a cypher of user's address
(authenticated using the `SECRET`
mentioned in section 'Back-end configuration and deployment' and
`JWT_EXPIRATION_TIME`) and delivers the data as response to the front-end:

```
{
  "address":"0x6ee638fba5908354fce7705ab5b887629894fe16",
  "accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg2ZWU2MzhmYmE1OTA4MzU0ZmNlNzcwNWFiNWI4ODc2Mjk4OTRmZTE2IiwiaWF0IjoxNTY4ODgyNjczLCJleHAiOjE1Njg4ODI3NTl9.rTMQxcPBOfnFJUOX3uAseF4kv1uSjVEQYLkkVzJ7jEU",
  "expiresIn":"86400"
}
```

From that moment until token expirance or MetaMask
account switch, front-end stores internally the JWT and includes it as an
`Authorization: Bearer ...` HTTP header
in subsequent calls  (*see example below*); in case header is not included or JWT
does not correctly validate, back-end will throw an unauthorized exception.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg2ZWU2MzhmYmE1OTA4MzU0Z...
```

### End user or research institution manager perform a register request

In order to be onboarded to the system (and be assigned to one of both roles
in the smart contract), both kind of users should then fill a form about
some minimal contact data; back-end's related endpoint is `/registerRequest`
that accepts POST requests containing payloads depending on the requested user role:

- End user:

```
{
  "cardId": "123-456-7890"
  "dataUrl": "http://example.com/john_doe_data.zip"
  "email": "john.doe@example.com"
  "firstName": "John"
  "phone": "555676767"
  "role": "END_USER"
  "surnames": "Doe Smith"
}
```

- Research institution manager:

```
{
  cardId: "0987-0182-120"
  email: "david.jones@example.com"
  firstName: "David"
  institutionName: "Acme Research Corporation"
  phone: "5556565656"
  role: "RESEARCH_INSTITUTION_MANAGER"
  surnames: "Jones Wilson"
}
```

Take into account the front-end does not need to include user's Ethereum
address (main user identifier) in the payload since its included in the cyphered
JWT authorization header.
In case the register request succeeds in both cases, back-end will return
in response related
payload response with a HTTP status code `200`.

### End user or research institution manager retrieve information about their register request

In case user is registered, performing a HTTP GET over the back-end endpoint `/registerRequest`
with the proper authorization header will return some payload as follows:

```
{
  "pendingBC":false,
  "_id":"5d8366fbdc600218231a86f4",
  "address":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
  "firstName":"David",
  "surnames":"Jones Wilson",
  "phone":"5556565656",
  "email":"david.jones@example.com",
  "institutionName":"Acme Research Corporation",
  "cardId":"0987-0182-120",
  "role":"RESEARCH_INSTITUTION_MANAGER",
  "updatedAt":"2019-09-19T11:31:07.784Z",
  "createdAt":"2019-09-19T11:31:07.784Z",
  "__v":0
}
```

### User cancels a not yet approved register request

Until the moment that the license manager accepts on-boarding of a new user (*see sections below*)
users, can opt out the system using a cancel front-end button that triggers
the back-end HTTP DELETE endpoint `/registerRequest/<userEthereumAddress>`, example:

```
Request URL: http://127.0.0.1:3001/registerRequest/0x2Ea4aaF6C030CEca24047B3d93f78546D017056b
Request Method: DELETE
Status Code: 200 OK
Remote Address: 127.0.0.1:3001
Referrer Policy: no-referrer-when-downgrade
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgyZWE0YWFmNmMwMzBjZWNhMjQwNDdiM2Q5M2Y3ODU0NmQwMTcwNTZiIiwiaWF0IjoxNTY4ODkyNjAxLCJleHAiOjE1Njg5MDEyNDF9.hpVP5327c-gWERdNYt8GteDX9TUV2VwS_zhqvGnzMFo
```

### License manager retrieves pending register requests

In order to proceed to a Know Your Customer process, license manager
should be able to have a view of pending register requests from users;
this is achieved through the back-end paginated
GET endpoint `/registerRequest?limit=9&page=1`;
requesting the endpoint with a proper authorization header corresponding
to an address that is registered as license manager in the smart contract
will result in getting the following sample output:

```
{
  "registerRequests":
  [
    {
      "pendingBC":false,
      "_id":"5d835d09dc600218231a86f1",
      "address":"0x6ee638fba5908354fce7705ab5b887629894fe16",
      "cardId": "123-456-7890"
      "dataUrl": "http://example.com/john_doe_data.zip"
      "email": "john.doe@example.com"
      "firstName": "John"
      "phone": "555676767"
      "role": "END_USER"
      "surnames": "Doe Smith"
      "updatedAt":"2019-09-19T10:48:41.071Z",
      "createdAt":"2019-09-19T10:48:41.071Z","__v":0
    }
  ],
  "totalDocs":1,
  "totalPages":1,
  "hasPrevPage":false,
  "hasNextPage":false,
  "page":1,
  "limit":9
}
```

`/registerRequest` endpoint accepts an optional query string parameter `role`
to filter users depending on their assigned role (*by default returns end users*);
for example, performing a GET over

```
http://127.0.0.1:3001/registerRequest?role=RESEARCH_INSTITUTION_MANAGER&limit=9&page=1
```

Returned payload consists on a JSON like the following:

```
{
  "registerRequests":
  [
    {
      "pendingBC":false,
      "_id":"5d836aa1dc600218231a86f5",
      "address":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
      "firstName":"Edward",
      "surnames":"Simpson Waine",
      "phone":"55565656565",
      "email":"edward.simpson@example.com",
      "institutionName":"Acme Research Corporation",
      "cardId":"0987-2132-123",
      "role":"RESEARCH_INSTITUTION_MANAGER",
      "updatedAt":"2019-09-19T11:46:41.290Z",
      "createdAt":"2019-09-19T11:46:41.290Z",
      "__v":0
    }
  ],
  "totalDocs":1,
  "totalPages":1,
  "hasPrevPage":false,
  "hasNextPage":false,
  "page":1,
  "limit":9
}
```

### License administrator deletes a register request

In case license manager does not achieve to validate the
user's on-boarding elegibility can perform a request to
DELETE endpoint `/registerRequest/<userAddress>` like
following URL:

```
http://127.0.0.1:3001/registerRequest/0x6ee638fba5908354fce7705ab5b887629894fe16
```

This will cause the back-end to delete the temporary register request
record from the database.

### License administrator on-boards a user to the system

This is the first work-flow that implies a change of state in the
smart contract deployed over the blockchain; although in all previous
calls, the back-end checks the role of the user using her Ethereum address
(encrypted in the authorization header).
This is done in order to allow or not to
perform some action or to get some view to the user depending on her role;
now at this new user on-boarding step the license manager is required to sign a
smart contract method invocation that assigns a role to an address.

In this case, front-end invokes directly MetaMask through its Web3 interface
to request for smart contract transaction signature and broadcast allowance:

```
contract.methods
        .setUserRole(address, roleCode)
        .send({ from: accounts[0], gas: "500000" })
```

In this case, there's no need to update back-end state making an explicit call,
because back-end in addition to interact with the smart contract using
the regular RPC HTTP API on port 8545 contains a web-socket event
listener to the Go Ethereum RPC on port 8546 (*although in development mode
using Ganache, web socket goes through the same 8545 port*).

Smart contract event solidity definition is as follows:

```
event GrantedAccessUser(address indexed userRequester, Roles indexed roleRequested);
```

containing address and assigned role of the user and causing the automatic
update of the MongoDB database.

### On-boarded user retrieves own personal information

Through back-end GET endpoint `/user` using the proper authorization header; a
registered user with role of end user or research institution manager
gets his profile information:

- End user

```
{
  "pendingBC":false,
  "_id":"5d837a22dc600218231a86ff",
  "address":"0x50dd9061d521f28999abb4d0439ca8f6420c0804",
  "firstName":"John",
  "surnames":"Doe Smith",
  "phone":"555676667",
  "email":"john.doe@example.com",
  "cardId":"1234-567-890",
  "role":"END_USER",
  "dataUrl":"http://example.com/john_doe_data.zip",
  "updatedAt":"2019-09-19T12:52:50.204Z",
  "createdAt":"2019-09-19T12:52:50.204Z","__v":0
}
```

- Research Institution Manager

```
{
  "pendingBC":false,
  "_id":"5d837a28dc600218231a8700",
  "address":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
  "firstName":"Paul",
  "surnames":"Simpson Reed",
  "phone":"555898998",
  "email":"paul.simpson@example.com",
  "institutionName":"Acme Research Corporation",
  "cardId":"098-098-098",
  "role":"RESEARCH_INSTITUTION_MANAGER",
  "updatedAt":"2019-09-19T12:52:56.802Z",
  "createdAt":"2019-09-19T12:52:56.802Z",
  "__v":0
}
```

### Research institution manager gets end on-boarded end count

Once on-boarded, a research institution manager can make a HTTP GET
request to the endpoint `/endUserCount` to receive a payload like the one below:

```
{"endUserCount": 12}
```

### Research institution manager requests access to end user's data

Performing a HTTP POST request over back-end endpoint `/accessRequests`,
a research institution manager triggers a back-end change of database state
setting asynchronously a flag on each end user document in order to show them
information about this data access request.

### End user retrieves pending data access requests from research institution managers

Using a GET request to a paginated back-end endpoint
`/accessRequests?limit=9&page=1` an end user can
retrieve information of pending research institution manager's data access requests;
see example response payload below:

```
{
  "accessRequests":[
  {
    "publicKey":
      {
        "_id":"5d833a977a2e3a4ad4ee63ab",
        "address":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
        "publicKey":"1b91b9b349e1c81914ff9cadab0168c40ff28f640ddf2e78a83ff5babe808a6f99f6cc0e2675778d737e1040aef012b62ddfed2481e3deaef21af754ac45dba0",
        "updatedAt":"2019-09-19T08:21:43.042Z",
        "createdAt":"2019-09-19T08:21:43.042Z",
        "__v":0
      },
      "encryptedPassword":{},
      "researchInstitutionManagerAddress":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
      "endUserAddress":"0x50dd9061d521f28999abb4d0439ca8f6420c0804",
      "revoked":false,
      "granted":false,
      "pendingBC":false,
      "researchInstitutionManager":
      {
        "pendingBC":false,
        "_id":"5d837a28dc600218231a8700",
        "address":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
        "firstName":"Paul",
        "surnames":"Simpson Reed",
        "phone":"555898998",
        "email":"paul.simpson@example.com",
        "institutionName":"Acme Research Corporation",
        "cardId":"098-098-098",
        "role":"RESEARCH_INSTITUTION_MANAGER",
        "updatedAt":"2019-09-19T12:52:56.802Z",
        "createdAt":"2019-09-19T12:52:56.802Z",
        "__v":0
      }
    },
    {
      "publicKey":
      {
        "_id":"5d833a977a2e3a4ad4ee63a9",
        "address":"0x6ee638fba5908354fce7705ab5b887629894fe16",
        "publicKey":"36247772ec8c60b80c1db0b2b9aa44d7c4b4acca7d159bd1a049fd0eef92f81b35082633ed6bc27889400f660df5695fe653be5f90e256bf0fab92b65b15033f",
        "updatedAt":"2019-09-19T08:21:43.042Z",
        "createdAt":"2019-09-19T08:21:43.042Z",
        "__v":0
      },
      "encryptedPassword":{},
      "researchInstitutionManagerAddress":"0x6ee638fba5908354fce7705ab5b887629894fe16",
      "endUserAddress":"0x50dd9061d521f28999abb4d0439ca8f6420c0804",
      "revoked":false,
      "granted":false,
      "pendingBC":false,
      "researchInstitutionManager":
      {
        "pendingBC":false,
        "_id":"5d837cdedc600218231a870b",
        "address":"0x6ee638fba5908354fce7705ab5b887629894fe16",
        "firstName":"Michael",
        "surnames":"Wilson Jones",
        "phone":"55512121212",
        "email":"michael.wilsonjones@example.com",
        "institutionName":"Second Acme Corporation",
        "cardId":"918273-120938",
        "role":"RESEARCH_INSTITUTION_MANAGER",
        "updatedAt":"2019-09-19T13:04:30.720Z",
        "createdAt":"2019-09-19T13:04:30.720Z",
        "__v":0
      }
    }
  ],
  "totalDocs":2,
  "totalPages":1,
  "hasPrevPage":false,
  "hasNextPage":false,
  "page":1,
  "limit":10
}
```

Notice that apart from research institutions that requested data access details,
response includes research institution manager's Ethereum public keys in order to
allow end users to deliver confidential information to them preventing the system
administrator to access it (*see sections below*).

### End user rejects a data access request

An end user can reject an access requests simply performing a DELETE
request over the endpoint `/accessRequest/<researchInstitutionManagerAddress>`
(*please note that accessRequest is singular in this case*)
like the URL shown below:

```
http://127.0.0.1:3001/0x6ee638fba5908354fce7705ab5b887629894fe16/accessRequest
```

### End user accepts a data access request

In this work-flow, the end user, after signing a transaction over the smart
contract to method:

```
grantPermissionToInstitution(address _requester)
```

once transaction gets confirmed (*and hence the contract
logs the signed transaction*) there's a websocket listener
in the back-end that updates the state accordingly
and waits for a PUT request to the endpoint
`/accessRequest/<researchInstitutionManagerAddress>` with a JSON paylod like
(*please note that accessRequest is singular in this case*)
the one below:

```
{
  encryptedPassword:
  {
    ciphertext: "90199555575a25317be48759cbbd0a6e",
    ephemPublicKey: "0456121a7530c8b5392a80433565e9b804e5fdd7811ef03cc70e264aa6866ae438d96cdb48d819d5f021d62ecb5e41ff5279f7cdfdd21defabf9f997fcce70e0d7",
    iv: "04423db952850e27673753bad96a94e6",
    mac: "ba380ff3a45fa8bfdb26d0aee45ff99b408df74dc1b20f38f229b72d5bff3306"
  },
  pendingBC: true
}
```

This payload contains the string `s3cr3tP4ssw0rd` encrypted with the public key of
the address `0x2ea4aaf6c030ceca24047b3d93f78546d017056b` (one of the example
research institution managers); this causes the back-end to
receive only encrypted information that goes end to end cyphered from the end user
front-end to the owner of the private key corresponding to the research instititution manager.

### Research institution manager retrieves consenting end user data

Research institution manager retrieves access to consenting end user data
performing HTTP GET requests to the paginated endpoint
`/accessRequests?limit=9&page=1` obtaining a payload like:

```
{
  "accessRequests":
  [
    {
      "researchInstitutionManagerAddress":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
      "endUserAddress":"0x50dd9061d521f28999abb4d0439ca8f6420c0804",
      "revoked":false,
      "granted":true,
      "encryptedPassword":
      {
        "iv":"04423db952850e27673753bad96a94e6",
        "ephemPublicKey":"0456121a7530c8b5392a80433565e9b804e5fdd7811ef03cc70e264aa6866ae438d96cdb48d819d5f021d62ecb5e41ff5279f7cdfdd21defabf9f997fcce70e0d7",
        "ciphertext":"90199555575a25317be48759cbbd0a6e",
        "mac":"ba380ff3a45fa8bfdb26d0aee45ff99b408df74dc1b20f38f229b72d5bff3306"
      },
      "dataUrl":"http://example.com/john_doe_data.zip"
    }
  ],
  "totalDocs":1,
  "totalPages":1,
  "hasPrevPage":false,
  "hasNextPage":false,
  "page":1,
  "limit":10
}
```

Notice that apart from their addresses and
the public link where users are supposed to hold
their encrypted data and the encrypted password
(*with researcher public key that makes the receiver
research institution manager the only one being able to decrypt it*)
there's not any other personal information; this information
is not needed since research institution manager only needs
access to whatever data records the user uploaded to his `dataUrl`.

### End users revoke access to previously approved data access request

In this case, like in the case corresponding to grant access, the user
starts invoking the smart contract method through front-end and MetaMask:

```
revokePermissionToInstitution(address _requester)
```

After that back-end listener updates the access request from the model.

### Research institution manager retrieves revoked data access request notifications

After an end user revokes data acces to a research institution manager as shown in
previous section; research institution manager receives the updated status of the
access request noticing that has been revoked and he is in charge of deleting it
from it's internal repositories in case it has already been downloaded.

```
{
  "accessRequests":
  [
    {
      "researchInstitutionManagerAddress":"0x2ea4aaf6c030ceca24047b3d93f78546d017056b",
      "endUserAddress":"0x50dd9061d521f28999abb4d0439ca8f6420c0804",
      "revoked":true,
      "granted":false
    }
  ],
  "totalDocs":1,
  "totalPages":1,
  "hasPrevPage":false,
  "hasNextPage":false,
  "page":1,
  "limit":10
}
```

Notice, that the back-end no longer sends nor the encrypted password or the link; only
the end user address in order to make possible to track the end user data inside
her repository.

## Software quality notes

This section describes software quality adopted during the project; mainly
consisting in the development of automated tests of both the smart contract
and also the backend and smart contract interaction.

Front-end was tested manually.

### Smart contract automated tests

Smart contract standalone repository contains a [Truffle Suite](https://www.trufflesuite.com/)
project; so to run the automated tests navigate to the repository folder, install the dependencies
and execute `npx truffle test` command:

```
$ cd ~/hda/contract
$ nodeenv --node 10.15.1 venv
$ source venv/bin/activate
(venv) $ npm install
(venv) $ npx truffle test
```

resulting in the following output:

```
- Fetching solc version list from solc-bin. Attempt #1

Compiling your contracts...
===========================
> Compiling ./contracts/HDA.sol
> Compiling ./contracts/Migrations.sol
> Compiling ./contracts/Ownable.sol

  Contract: HDA
    setUserRole
      ✓ does not allow a not registered user to create a not registered user (85ms)
      ✓ does not allow a not registered user to create an end user (60ms)
      ✓ does not allow a not registered user to create a doctor (70ms)
      ✓ does not allow a not registered user to create a license manager (58ms)
      ✓ does not allow a not registered user to create a research institution manager (54ms)
      ✓ does not allow an end user to create a not registered user (52ms)
      ✓ does not allow an end user to create an end user (56ms)
      ✓ does not allow an end user to create a doctor (57ms)
      ✓ does not allow an end user to create a license manager (49ms)
      ✓ does not allow an end user to create a research institution manager (49ms)
      ✓ does not allow a doctor to create a not registered user (38ms)
      ✓ does not allow a doctor to create an end user (51ms)
      ✓ does not allow a doctor to create a doctor (41ms)
      ✓ does not allow a doctor to create a license manager (41ms)
      ✓ does not allow a doctor to create a research institution manager (42ms)
      ✓ allows a license manager to create a not registered user (58ms)
      ✓ allows a license manager to create an end user (59ms)
      ✓ allows a license manager to create a doctor (51ms)
      ✓ does not allow a license manager to create a license manager (42ms)
      ✓ allows a license manager to create a research institution manager (52ms)
      ✓ does not allow a research institution manager to create a not registered user (45ms)
      ✓ does not allow a research institution manager to create an end user (47ms)
      ✓ does not allow a research institution manager to create a doctor (45ms)
      ✓ does not allow a research institution manager to create a license manager (41ms)
      ✓ does not allow a research institution manager to create a research institution manager (39ms)
      ✓ requires the owner of the contract to create a license manager (64ms)
    grantPermissionToInstitution
      ✓ does not allow a not registered user to grant permission to a not registered user (47ms)
      ✓ does not allow a not registered user to grant permission to an end user (41ms)
      ✓ does not allow a not registered user to grant permission to a doctor (44ms)
      ✓ does not allow a not registered user to grant permission to a license manager (50ms)
      ✓ does not allow a not registered user to grant permission to a research institution manager (38ms)
      ✓ does not allow an end user to grant permission to a not registered user (38ms)
      ✓ does not allow an end user to grant permission to an end user (39ms)
      ✓ does not allow an end user to grant permission to a doctor (44ms)
      ✓ does not allow an end user to grant permission to a license manager (40ms)
      ✓ allows an end user to grant permission to a research institution manager (62ms)
      ✓ does not allow a not registered user to grant permission to a not registered user (45ms)
      ✓ does not allow a not registered user to grant permission to an end user (62ms)
      ✓ does not allow a not registered user to grant permission to a doctor (39ms)
      ✓ does not allow a not registered user to grant permission to a license manager (46ms)
      ✓ does not allow a not registered user to grant permission to a research institution manager (46ms)
      ✓ does not allow a doctor to grant permission to a not registered user (39ms)
      ✓ does not allow a doctor to grant permission to an end user (40ms)
      ✓ does not allow a doctor to grant permission to a doctor (39ms)
      ✓ does not allow a doctor to grant permission to a license manager (47ms)
      ✓ does not allow a doctor to grant permission to a research institution manager (44ms)
      ✓ does not allow a license manager to grant permission to a not registered user
      ✓ does not allow a license manager to grant permission to an end user (42ms)
      ✓ does not allow a license manager to grant permission to a doctor (45ms)
      ✓ does not allow a license manager to grant permission to a license manager (39ms)
      ✓ does not allow a license manager to grant permission to a research institution manager (48ms)
      ✓ does not allow a research institution manager to grant permission to a not registered user (38ms)
      ✓ does not allow a research institution manager to grant permission to an end user (40ms)
      ✓ does not allow a research institution manager to grant permission to a doctor (44ms)
      ✓ does not allow a research institution manager to grant permission to a license manager (45ms)
      ✓ does not allow a research institution manager to grant permission to a research institution manager (57ms)
    revokePermissionToInstitution
      ✓ allows the end user that is the owner of the data to revoke access to a research institution manager that had it granted (128ms)
      ✓ does not allow an end user that did not grant access to a research institution manager to his/her data to revoke the access (58ms)


  58 passing (17s)
```

### Back-end and smart contract integration tests

To run this integration tests, just deploy the development version
of the backend (*see previous section*), restore your MongoDB in case
there are some previous development records and run:

```
(venv) $ npm run test
```

Obtainin the following output:

```
> backend@1.0.0 test /home/alfonso/hda/backend
> npx mocha --timeout 20000 --exit tests/*.test.js

  Access requests tests
    ✓ Should allow a research institution manager to create access requests (9310ms)
    - Should allow a user to accept an access request
    ✓ Should allow a user to revoke a previously granted access request (6823ms)
    ✓ Should allow a research institution manager to get a revoked access request (6642ms)
    ✓ Should allow a research institution manager idempotently post access requests (6624ms)
    ✓ Should allow a research institution manager idempotently post access requests (6581ms)

  Register request related tests
    ✓ Should deny access with bad signed token
    ✓ Should allow a user to request register (68ms)
    ✓ Should prevent a different user to delete a register request (52ms)
    ✓ Should allow a license manager to delete a register request (39ms)
    ✓ Should avoid a user to post a second register request while there's another pending (43ms)
    ✓ Should avoid a user to  post a register request using a non supported role
    ✓ Should test smart contract integration
    ✓ Should test getRegisterRequest endpoint using admin address (61ms)
    ✓ Should test getRegisterRequest endpoint using another address (45ms)
    ✓ Should test getRegisterRequest endpoint using own address (48ms)

  User tests
    ✓ Should allow an admin to onboard a user with a pending register request (2135ms)
    ✓ Should deny a non admin user to onboard a user with a pending register request (62ms)
    ✓ Should avoid a non admin user to delete a user (2161ms)
    ✓ Should allow an admin to get user data (2175ms)
    ✓ Should allow an onboarded user to get her/his own data (2152ms)
    ✓ Should avoid any other user to get another user data (2128ms)
    ✓ Should allow a License Administrator to get endUser count (8532ms)
    ✓ Should avoid a EndUser to get endUser count (8469ms)


  23 passing (1m)
  1 pending
```

## Security consideration

### Cryptographic libraries

All cryptographic features of the application rely on widely
used open source dependencies of mature cryptographic schemas.

### Go Ethereum node and RPC API

During the developent, we used plain HTTP to interact with Go
Ethereum node's RPC API through the 8545 port; although the node was *locked*
in a sense that required valid cryptographic signatures to process
transactions; in Ethereum community this is considered a bad practice
since it is vulnerable to denial of service DoS and man in the middle
attacks; depending on the targeted flavor of Ethereum blockchain, should
be reconsidered using a permision model, setting up a virtual private
network between nodes, etc.

### Cross site side scripting and encryption/decryption in the browser's JavaScript engine

It is virtually impossible to audit the large amount of packages and dependencies
of a JavaScript based front-end in order to guarantee there's no risk of cross
site scripting; given that fact, MetaMask uses a completely separate storage
in order to keep private keys safe; in our development we used MetaMask to handle
user's private keys and signatures; but the last part regarding end to end
confidential secret communication uses browser's JavaScript engine memory
to encrypt and decrypt a password, an implementation like that is potentially
vulnerable to this XSS attacks that can end up in compromised password and private keys;
this can be improved in a mobile development (*mobile apps run in a more controlled environment
than web apps*), and specially using trusted execution environment APIs.


## Test environment
Instructions on how to test the environment can be found at [docs/test.md](docs/test.md).

## Minimal deployment
You can find a step to step guide on how to deploy the backend in [docs/deployment.md](docs/deployment.md).

## Swagger documentation
Once deployed, you can visit [http://localhost:3001/api-docs/#/](http://localhost:3001/api-docs/#/)
in order to access a Swagger landing page containing endpoint documentation.

## Instructions to full deployment with sample data
If you want to have some test data available for your app, the only one tutorial you need is
this one: [docs/deployment-test-data.md](docs/deployment-test-data.md).


### Running a sample front-end for testing purposes:
You shall work with the React version of the frontend contained in the frontend repository
of the ```bitbucket``` project for Blockchain-hda. In any case you have the option to do a quick test
with some sample frontend, following these steps:


Start the sample test environment:
```
$ source venv/bin/activate
(venv) $ cd sample
(venv) $ npm install
(venv) $ npm start
```
