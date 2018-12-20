const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
    _id: userOneId,
    email: 'hardik@example.com',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id:userOneId.toHexString(),access:'auth'},'abc123').toString()
    }]

},{
    _id: userTwoId,
    email: 'jain@example.com',
    password: 'userTwoPass'
}]


const todos = [{
    _id : new ObjectID(),
    text: 'First text todo'
},{
    _id : new ObjectID(),
    text: 'Second text todo',
    completed: true,
    completedAt: 3085873
}];

var populateTodos = (done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
}

var populateUsers =  (done) => {
    User.deleteMany({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        return Promise.all([userOne,userTwo])
    }).then(() => done());
}

module.exports = {todos,populateTodos,users,populateUsers};