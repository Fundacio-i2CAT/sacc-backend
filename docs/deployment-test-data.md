### Bootstrap backend and smart contract with sample data

Now we will make sure we have some sample data available such as some user profiles with 
fake ethereum currency.  

Firstly, data population expects MongoDB service to be available in order to use it.
You can make mongodb service available with the following command:
```
sudo service mongod start
```

Run Ganache with 100 pre-populated accounts:
```
(venv) $ npx ganache-cli --mnemonic '<twelve word mnemonic space separated>' -h 0.0.0.0 -g 0 -a 100
```

Deploy contract in another terminal and start NodeJS server
```
(venv) $ node utils/deploy.js
(venv) $ node index.js
```

Bootstrap in another terminal:
```
(venv) $ node utils/bootstrap.js
```

Which shall in turn give an output similar to this one:
```
Registering request and creating user: 0x50DD9061d521F28999Abb4d0439cA8f6420c0804 (Wesley Katie Smith)
Registering request and creating user: 0x2Ea4aaF6C030CEca24047B3d93f78546D017056b (Corey Scott Nichols)
Registering request for user:          0x4C3f2b3c1Bb5371096c34CF4c45A5d9538B55472 (Joel Edna Little)
Registering request for user:          0x5BE82E4507194e6ADE12F137F6b719b6396A09e6 (Jack Ada Lindsey)
Registering request for user:          0x39a762C60551330ceE9a42fEe2fd1a2455238Cf1 (Blanche Billy Warren)
Registering request and creating user: 0x3fd58389E07101fCC92d180E6DB594050D6a8898 (Isabelle Paul Hansen)
...
(up to 84 users or register requests)
```

Once you have done this you shall have your local deployment of the ```Blockchain-hda``` backend ready to serve
the frontend.

#### Resetting process
Shall you need to redeploy the backend for any reason, remember to empty your Mongo Database following these steps:

Enter your Mongo console:
```
(venv) $ mongo
```

Delete currently set up database:
```
> use blockchain_hda
> db.dropDatabase()
> exit
```

Just to fulfill my Obsessive Compulsive Disorder, please go on and restart MongoDB service:
```
(venv) $ sudo service mongod restart
```

Great! You did it! Everything ready to start from scratch a bright new backend with populated data, follow the steps
starting from the top!
