import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
import Web3 from 'web3'
import axios from 'axios'

const BACKEND = 'http://localhost:3001/'

export default class LoginButton extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false
    };
  }

  startLogin = async (event) => {
    await window.ethereum.enable()
    let web3 = new Web3(window.ethereum)
    let accounts = await web3.eth.getAccounts()
    let defaultAccount = accounts[0]
    let challenge = await axios.post(`${BACKEND}login`, { 'address': defaultAccount })
    let challengeToSign = challenge.data.challenge
    let signature = await web3.eth.sign(web3.utils.keccak256(challengeToSign), defaultAccount)
    let response = await axios.post(`${BACKEND}login`, { challengeToSign: challengeToSign,
							 address: defaultAccount,
							 signature: signature })
  }

  render() {
    return (
      <div>
	<Button size="lg" variant="primary" onClick={this.startLogin}>Login</Button>
      </div>
    )
  }

}
