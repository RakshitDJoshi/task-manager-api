const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/Task')
const { userOneId, userOne, taskThree, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create new task', async () => {
    const response = await request(app)
        .post('/tasks') 
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            description: 'create a new task'
        }).expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Should get user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send()
        .expect(200)

    expect(response.body.length).toBe(2)
})

test('Should not delete tasks of other users', async () => {
    await request(app)
        .delete('/tasks/' + taskThree._id)
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send()
        .expect(404)
    
    const task = await Task.findById(taskThree._id)
    expect(task).not.toBeNull()
})