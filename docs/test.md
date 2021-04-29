## Sample authentication
First enabled endpoint corresponding to `/login` route:

Example first call (*performed by MetaMask*):

```
 curl -k -H "Content-Type: application/json" -XPOST http://localhost:3001/login --data '{"address": "0x55f244dE3283760B0d3fc90F72645D08B2F737f6"}'
```

The server then returns a challenge to be signed with corresponding address private key:

```
{"challenge":"0x55f244dE3283760B0d3fc90F72645D08B2F737f61560261265467"}
```

*Note that the challenge consists on the address with a timestamp 1560261002442 appended*

Once received the challenge, the front-end requires the user to sign the challenge using
MetaMask and send it back:

```
 curl -k -H "Content-Type: application/json" -XPOST http://localhost:3001/login --data '{"address": "0x55f244dE3283760B0d3fc90F72645D08B2F737f6", "signature": "0xa1877197d199d1d9f686e960cf5bce224d3c8d79878923694b3f3135fcaf05cc3a28c00b488bbfc74fb5cf7cb582d03de932067a0eabae9787b008a6e0d121231c"}'
```

If the signature is correct it returns a 200 status code; 401 unauthorized in any other case. Sample output below
containing accessToken (a JWT) that can be used to authenticate within the back-end until expires:

```
{"address":"0x6b11bc1Bf1A603eD8a933294102a30bA7c6e4979","accessToken":"dyJhbGciO9JIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHhiMTZFYTBiNUNFQjM5ODliODc5OTA0NjMxOGU4N2FhRjE5YTdkQ2Y0IiwiaWF0IjoxNTYwOTM1MDcxLCJleHAiOjE1NjB5MzUxNTd9.iu-7fL2sM-8LJ9wK64mznT64ZRLOXhFqESa7wFsS1HI","expiresIn":"86400"}
```

## Service description

### registerRequest

#### POST (anyone for a first time)

```
curl -k -H "Content-Type: application/json" -H "Authorization: Bearer dyJhbGci ... 15g2"  -XPOST http://localhost:3001/login --data '{"firstName": "firstName", "surnames": "surnames", "phone": "phone", "email": "email@example.com", "institutionName": "institutionName", "cardId": "cardId", "role": "PATIENT"}'
```

#### GET (only License Administrator)

```
curl -k -H "Content-Type: application/json" -H "Authorization: Bearer dyJhbGci ... 15g2" -XGET http://localhost:3001/registerRequest?page=1&limit=2
```

Sample response:

```
{
    "registerRequests":
    [
        {
            "_id":"5d2da08ce5e59e39bc5e63a0",
            "address":"0x5be82e4507194e6ade12f137f6b719b6396a09e6",
            "firstName":"John",
            "surnames":"Doe",
            "phone":"555555555",
            "email":"john@example.com",
            "cardId":"978129837912J",
            "role":"PATIENT",
            "updatedAt":"2019-07-16T10:01:48.243Z",
            "createdAt":"2019-07-16T10:01:48.243Z","__v":0
        }
    ],
    "totalDocs":1,
    "totalPages":1,
    "hasPrevPage":false,
    "hasNextPage":false,
    "page":1,
    "limit":2}
```

#### DELETE (only License Administrator or Requester)

```
curl -k -H "Content-Type: application/json" -H "Authorization: Bearer dyJhbGci ... 15g2" -XDELETE http://localhost:3001/registerRequest/0x6F5F36f448C2932AAd5D62a14E14F85b756BC9BC
```

### user

#### POST (only License Administrator)

```
curl -k -H "Content-Type: application/json" -H "Authorization: Bearer dyJhbGci ... 15g2" -XPOST http://localhost:3001/user --data '{"address": "0x6F5F36f448C2932AAd5D62a14E14F85b756BC9BC"}'
```

#### GET (only License Administrator or same User)

```
curl -k -H "Content-Type: application/json" -H "Authorization: Bearer dyJhbGci ... 15g2" -XGET http://localhost:3001/user/0x6F5F36f448C2932AAd5D62a14E14F85b756BC9BC
```
