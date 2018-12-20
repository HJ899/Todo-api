require('./config/config');
const express      = require('express');
const bodyParser   = require('body-parser');
const _            = require('lodash');
const { mongoose } = require('./db/mongoose');
const { Todo }     = require('./models/todo');
const { User }     = require('./models/user');
const { ObjectID } = require('mongodb');
const {authenticate} = require('./middleware/authenticate');

const app = express();

app.use(bodyParser.json());

app.post('/todos',authenticate,(req,res) => {
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    todo.save().then((doc) => {
        res.send(doc);
    }).catch((e) => {
        res.status(400).send(e);
    })
    //console.log(Todo);
}); 

app.get('/todos',authenticate,(req,res) => {
    Todo.find({
        _creator: req.user._id
    }).then((todos) => {
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    })
})

app.get('/todos/:id',authenticate,(req,res) => {
    var id = req.params.id;
    if(!ObjectID.isValid(id)) return res.status(404).send();
    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if(!todo) res.status(404).send();
        else res.send({todo});
    }).catch(e => res.status(400).send());
});

app.delete('/todos/:id',authenticate ,(req, res) => {
    var id = req.params.id;
    Todo.find
    if(!ObjectID.isValid(id)) return res.status(404).send();

    Todo.findOneAndDelete({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if(!todo) return res.status(404).send();
        else res.send({todo});
    }).catch(e=>res.status(400).send());
});

app.patch('/todos/:id',authenticate,(req,res) => {
    var id = req.params.id;
    var body = _.pick(req.body,['text','completed']);
    if(!ObjectID.isValid(id)) return res.status(404).send();

    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    },{$set: body}, {new: true}).then((todo) => {
        if(!todo) return res.status(404).send();
        res.send({todo});
    }).catch(e => res.status(400).send());
})

app.post('/users',(req,res) => {
    var body = _.pick(req.body, ['email','password']);
    var user = new User(body);
    user.save()
        .then(() => user.generateAuthToken())
        .then((token) => {
            res.header('x-auth',token).send(user)
        })
        .catch(e => res.status(400).send(e));
});

app.post('/users/login', (req,res) => {
    var body = _.pick(req.body, ['email','password']);

    User.findByCredentials(body.email,body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth',token).send(user)
        })
    }).catch(e => {
        res.status(400).send();
    })
})

app.get('/users/me', authenticate ,(req,res) => {
    res.send(req.user);
})

app.delete('/users/me/token', authenticate, (req,res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => res.status(400).send());
})

app.listen(process.env.PORT, () => {
    console.log(`App listening on port ${process.env.PORT}!`);
});

module.exports = { app };