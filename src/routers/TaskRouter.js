const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/Task')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
     const newTask = new Task({
        // copy all properties from req.body
        ...req.body,
        owner: req.user._id
    })

    try {
        await newTask.save()
        res.status(201).send(newTask)
    } catch (error) {
        res.status(400).send(error)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// Get /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })

        if(req.user.tasks.length === 0){
            return res.status(404).send()
        }

        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ id: req.params.id, owner: req.user._id })
        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updatableFields = ['description', 'completed']
    const updatedFields = Object.keys(req.body)
    const isUpdateOperationValid = updatedFields.every((field) => updatableFields.includes(field))

    if(!isUpdateOperationValid){
        return res.status(400).send({'error': 'Field tried to update is not valid'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if(!task){
            return res.status(404).send()
        }

        updatedFields.forEach(field => { task[field] = req.body[field] })
        await task.save()

        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if(!deletedTask){
            return res.status(404).send()
        }

        res.send(deletedTask)
    } catch (error) {
        res.status(400).send()
    }
})

module.exports = router