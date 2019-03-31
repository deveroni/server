/*
*    Script created by Bram Koene to authenticate with postgresql and express
*    All Rights Reserved
*/

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var SHA256 = require("crypto-js/sha256");
var moment = require('moment');
var creds = require('../secret').dbUser;

// Configuring the postgresql api
const {Client} = require('pg')
const client = new Client({
    user: creds.dbUser,
    host: 'localhost',
    database: 'meloan',
    password: creds.dbPassword,
    port: 5432,
})
client.connect()
// END configuring the postgresql api

// set use for express
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
// END set use for express

// Basic functions used in multiple instances
function hashPwd(password) {
    return SHA256(password).toString()
}

function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getUserID(username, email) {
    const query = {
        text: 'SELECT * FROM Users WHERE username=$1 OR email=$2',
        values: [username, email]
    }
    client.query(query)
        .then(result => { return result.rows[0].id })
        .catch(e => console.error(e.stack))
}
//END Basic functions used in multiple instances

//Bearer token generation, validation and regeneration
function generateBearer(userID) {
    //first remove any tokens already in db for user
    const _query = {
        text: 'DELETE FROM tokens WHERE id = $1',
        values: [userID]
    }
    client.query(_query)
        .then(result => {})
        .catch(e => console.error(e.stack))
    //Now create a object with the necesery info for the tokens
    var tokens = {
        id: userID,
        bearer: makeid(15),
        refresh: makeid(15),
        bearerTokenExpire: moment().add(150, 'minutes').toDate(),
        refreshTokenExpire: moment().add(7, 'days').toDate()
    }
    //push the tokens to the database
    const __query = {
        text: 'INSERT INTO tokens (id, bearer_token, bearer_token_expire, refresh_token, refresh_token_expire) VALUES ($1, $2, $3, $4, $5)',
        values: [userID, tokens.bearer, tokens.bearerTokenExpire, tokens.refresh, tokens.refreshTokenExpire]
    }
    client.query(__query)
        .then(result => {
            console.log(tokens)
            return tokens
        })
        .catch(e => console.error(e.stack))
    //return the tokens to app.post('/login') for returning them to the front end
    return tokens
}

function validateBearer(id, bearer) {
    //get corresponding token and id from database
    const query = {
        text: 'SELECT * FROM tokens WHERE id=$1 AND bearer_token=$2',
        values: [id, bearer]
    }
    client.query(query)
        .then(result => {
            //check if token and id are valid
            if (!result.rows[0]) {
                console.log('does not exist')
                return false
            } else if (moment() <= result.rows[0].bearer_token_expire && result.rows[0].bearer_token == bearer) {
                console.log('is correct')
                //token and id are valid and still allowed
                return true
            } else if(moment() >= result.rows[0].bearer_token_expire){
                //token no longer valid
                return 'token no longer valid'
            } else {
                console.log('else')
                return false
            }
        })
        .catch(e => console.error(e.stack))
}
//END Bearer token generation, validation and regeneration

//requests handled by express
app.post('/hash', (req, res) => {
    console.log(SHA256(req.body.query).toString())
    res.status(200).send(hashPwd(req.body.query))
});

app.get('/', function (req, res, next) {
    console.log(typeof req.body.username)
    client.query(`SELECT * FROM users where username = ${req.body.username}`, [1], function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }

        res.status(200).send(result.rows);
    });
});

app.post('/login', (req, res) => {
    console.log(req.body.user)
    const query = {
        text: 'SELECT * FROM Users WHERE username=$1 OR email=$1',
        values: [req.body.user.toLowerCase()],
    }
    client.query(query)
        .then(result => {
            //User exist and gotton user info from database
            var pwdHash = hashPwd(req.body.password)
            if (result.rows.length <= 0) {
                res.status(400).send('no user found')
            } else if (pwdHash === result.rows[0].password) {
                var tokens = generateBearer(result.rows[0].id)
                console.log(tokens)
                res.status(200).send(tokens)
            } else {
                res.status(400).send('Username and Password are NOT correct')
            }
        })
        .catch(e => console.error(e.stack))
});

app.post('/register', (req, res) => {
    const query = {
        text: 'SELECT * FROM Users WHERE username=$1 OR email=$2',
        values: [req.body.username, req.body.email],
    }
    client.query(query)
        .then(result => {
            if(result.rows[0]) {
                res.status(400).send('User with that name or email already exits')
            } else {
                var pwdHash = hashPwd(req.body.password)
                client.query('SELECT MAX(id) AS "maxID" FROM Users')
                    .then(result => {
                        let id = result.rows[0].maxID + 1
                        const query = {
                            text: 'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)',
                            values: [id, req.body.username.toLowerCase(), req.body.email.toLowerCase(), pwdHash]
                        }
                        client.query(query)
                            .then(result => {
                                res.status(200).send(result)
                            })
                            .catch(e => console.error(e.stack))
                    })
                    .catch(e => console.error(e.stack))
            }
        })
        .catch(e => console.error(e.stack))
});
//END requests handled by express

//Listener for express
// app.listen(4000, function () {
//     console.log('Server is running.. on Port 4000');
// });

module.exports = {
    app,
    validateBearer
}