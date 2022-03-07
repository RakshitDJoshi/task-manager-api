const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./Task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Must not contain the string \'password\'')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age should be a positive integer")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// Using virtual, the property is not stored in the database. This just defines a relationship.
// We have mapped the owner property of Task with the _id property of user.
// To get all tasks for a user, we will first need to use the populate method. Without this, tasks will be null.
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// overriding the toJSON function so that when we log the user to console or send it in a http response
// (and other in use cases where toJSON is used) we remove the password and token first
userSchema.methods.toJSON = function (){
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })

    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('Login failed')
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if(!isPasswordCorrect){
        throw new Error('Login failed')
    }

    return user
}

// hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// delete all associated tasks if a user is deleted
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User