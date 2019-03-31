var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var auth = require('./lib/auth').app
var ValidateBearer = require('./lib/auth').validateBearer

app.use('/auth', auth);

app.get('/test', (req, res) => {
    console.log(req.query.id,req.query.bearer)
    if(!ValidateBearer(req.query.id,req.query.bearer)){
        res.status(200).send('bearer is correct')
    }else{
        res.status(200).send('bearer is NOT correct')
    }
});

app.listen(4000, () => {
    console.log('App listening on port 4000!');
});