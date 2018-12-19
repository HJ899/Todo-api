require('../config/config');
const express      = require('express');
const bodyParser   = require('body-parser');
const _            = require('lodash');
const { mongoose } = require('./db/mongoose');
const { Todo }     = require('./models/todo');
const { User }     = require('./models/user');
const { ObjectID } = require('mongodb');


const app = express();

app.use(bodyParser.json());

app.post('/todos',(req,res) => {
    var todo = new Todo({
        text: req.body.text
    });
    todo.save().then((doc) => {
        res.send(doc);
    }).catch((e) => {
        res.status(400).send(e);
    })
    //console.log(Todo);
}); 

app.get('/todos', (req,res) => {
    Todo.find().then((todos) => {
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    })
})

app.get('/todos/:id', (req,res) => {
    var id = req.params.id;
    if(!ObjectID.isValid(id)) return res.status(404).send();
    Todo.findById(id).then((todo) => {
        if(!todo) res.status(404).send();
        else res.send({todo});
    }).catch(e => res.status(400).send());
});

app.delete('/todos/:id', (req, res) => {
    var id = req.params.id;
    Todo.find
    if(!ObjectID.isValid(id)) return res.status(404).send();

    Todo.findByIdAndDelete(id).then((todo) => {
        if(!todo) return res.status(404).send();
        else res.send({todo});
    }).catch(e=>res.status(400).send());
});

app.patch('/todos/:id', (req,res) => {
    var id = req.params.id;
    var body = _.pick(req.body,['text','completed']);
    if(!ObjectID.isValid(id)) return res.status(404).send();

    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id,{$set: body}, {new: true}).then((todo) => {
        if(!todo) return res.status(404).send();

        res.send({todo});
    }).catch(e => res.status(400).send());
})

app.listen(process.env.PORT, () => {
    console.log(`App listening on port ${process.env.PORT}!`);
});

module.exports = { app };