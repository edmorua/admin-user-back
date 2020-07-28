const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
  }
})

const User = mongoose.model('user',UserSchema)

module.exports = User