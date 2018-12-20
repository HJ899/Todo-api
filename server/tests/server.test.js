const expect                                         = require('expect');
const request                                        = require('supertest');
const { ObjectID }                                   = require('mongodb');
const { app }                                        = require('./../server');
const { Todo }                                       = require('./../models/todo');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');
const { User }                                       = require('../models/user');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('Should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err,res) => {
                if(err) return done(err);
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).then().catch((e) => done(e));
            })
    });

    it('Should not create todo', (done) => {
        var text = '';
        request(app)
            .post('/todos')
            .send({text})
            .expect(400)
            .end((err,res) => {
                if(err) return done(err);

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).then().catch((e) => done(e));
            })
    });
});

describe('GET /todos' , () => {
    it('Should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    })
});

describe('GET /todos/:id' , () => {
    it('Should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('Should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${(new ObjectID).toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('Should return 404 for non-object ids', (done) => {
        request(app)
            .get('/todos/123abc')
            .expect(404)
            .end(done);
    })
});

describe('DELETE /todos/:id', () => {
    it('Should delete a todo', (done) => {
        request(app)
            .delete(`/todos/${todos[1]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(todos[1]._id.toHexString());
            })
            .end((err,res) => {
                if(err) return done(err);
                Todo.findById(todos[1]._id).then((todo) => {
                    expect(todo).toNotExist();
                    done();
                }).catch(e => done(e));
            });
    });

    it('Should return 404 if todo not found', (done) => {
        request(app)
            .delete(`/todos/${(new ObjectID).toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('Should return 404 if object id is invalid', (done) => {
        request(app)
            .delete(`/todos/234`)
            .expect(404)
            .end(done);
    })
});

describe('PATCH /todos/:id', () => {
    it('Should update a todo', (done) => {
        var text = 'This is updated text';

        request(app)
            .patch(`/todos/${todos[0]._id.toHexString()}`)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeA('number');
            })
            .end(done)
    })

    it('Should clear completedAt when todo is not complete', (done) => {
        var text = 'This is updated text';
        request(app)
        .patch(`/todos/${todos[1]._id.toHexString()}`)
        .send({
            completed: false,
            text
        })
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(text);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotExist();
        })
        .end(done)
    })
});

describe('GET /users/me', () => {
    it('Should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done); 
    });

    it('Should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('Should create a user', (done) => {
        var email = 'example@example.com';
        var password = 'abcdefgsj';
        request(app)
            .post('/users')
            .send({email,password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist();
                expect(res.body._id).toExist();
                expect(res.body.email).toBe(email);
            })
            .end(err => {
                if(err) return done(err);

                User.findOne({email}).then(user => {
                    expect(user).toExist();
                    expect(user.password).toNotBe(password);
                    done();
                }).catch(e => done(e));

            });

    })

    it("Should return validation errors if request invalid", (done) => {
        var email = 'abc';
        var password = '123';
        request(app)
            .post('/users')
            .send({email,password})
            .expect(400)
            .end(done);
    })

    it('Should not create a user if email in use', (done) => {
        var email = users[0].email;
        var password = '123456';

        request(app)
            .post('/users')
            .send({email,password})
            .expect(400)
            .end(done);
    })
});

describe('POST /user/login', () => {
    it('Should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({email: users[1].email, password: users[1].password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist();
            })
            .end((err,res) => {
                if(err) return done(err);

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[0]).toInclude({
                        access:'auth',
                        token: res.headers['x-auth']
                    })
                    done();
                }).catch(e => done(e));
            })
    });

    it('Should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({email: users[1].email, password: users[0].password})
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toNotExist();
            })
            .end((err,res) => {
                if(err) return done(err);
                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(e => done(e));

            });
    })
});

describe('DELETE /users/me/token' , () => {

    it('Should remove auth token on logout' ,(done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err,res) => {
                if(err) return done(err);
                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(e => done(e));
            })
    })
    
});