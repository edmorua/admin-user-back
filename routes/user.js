const express = require('express');
const router = express.Router();
const sha1 = require('sha1');
const jwt = require('jsonwebtoken');
const validator = require('../utils/validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @route   GET api/user/me
 * @dec     Get the user profile
 * @access  Private
 */
router.get('/myprofile',auth, async (req, res) => {
  const userLogged = req.user;
  try {
    const userId = userLogged.id
    if(!userId) {
      return res.statusCode(500).json({message: 'Something wrong with the token, no id found'});
    }
    const query = {
      $and: [
        { _id: { $eq : userId } },
        { active: { $eq: true}  },
      ]
    }
    const user = await User.findOne(query)
    if(!user) {
      return res.status(400).json({
        message: 'No active user found',
        error: true
      })
    }
    return res.json({
      message: 'Successfully find the profile',
      user: user,
    })
  }catch(error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
      errorMessage: error.message
    })
  }
})

/**
 * @route   GET api/users/
 * @desc    Get all the users
 * @access  Public
 */
router.get('/', async(req,res) => {
  try{
    const qry = { active: {$eq: true}};
    const projection = {__v:0}
    const users = await User.find(qry,projection);
    console.log({users})
    return res.json({users:users})
  }catch(error) {
    console.log(error);
    return res.status(500).json({message:'Internal Server Error',errorMessage: error.message})
  }
})


/**
 * @route   POST api/users/
 * @desc    Create a new user
 * @access  Public
 */
router.post('/', async (req,res) => {
  const {body} = req
  if(!body) {
    return res.status(404).json({message: 'Empty body'})
  }
  const {username,email,password} = body
  if(!username || !email || !password) {
    return res.status(404).json({
      message:'name, email or password not found'
    })
  }
  if(!validator.validEmail(email)) {
    return res.status(400).json({
      message: 'invalid email'
    })
  }
  if(!validator.validPassword(password)) {
    return res.status(400).json({
      message: 'invalid password, please enter a password with 6 or more charachters'
    })
  }
  try {
    let user = await User.findOne({email:email});
    if(user) {
      return res.status(400).json({
        message: "This email already exists"
      });
    }
    const encryptPassword = sha1(password)
    user = new User({
      name: username,
      email: email,
      password: encryptPassword,
      updated: Date.now()
    })
    await user.save();
    console.log({user});
    const id = user.id;
    console.log({id})
    const payload = {
      user: {
        id: id,
        email : email,
        password: encryptPassword,
        admin: false
      }
    }
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: 3600},
      (err,token) => {
        if(err) throw err;
        res.status(201).json({
          message: 'User created succesfully',
          id: id,
          token: token
        });
      }
    )
  }catch(error) {
    console.error(error.message);
    res.status(500).json({message: 'Server Error', errorMessage: error.message})
  }
  
})

/**
 * @route   GET api/users/:userId
 * @desc    Get the user information
 * @access  Private
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    console.log(req)
    const {userId} = req.params;
    const user = await User.findOne({_id: {$eq:userId}}, {__v:0});
    if(!user) {
      return res.status(400).json({
        message: 'User not found',
      })
    }
    return res.json({user:user})
  }catch(error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Error Server',
      errorMessage: error.message
    })
  }
})
/**
 * @route   PUT api/users/:userId
 * @desc    Update user information
 * @access  Private
 */
router.put('/:userId',auth, async (req,res) => {
  try{
    const userLogged = req.user;
    const {userId} = req.params;
    if(userLogged.id !== userId) {
      return res.status(403).json({
        message: "Permisions denied, can't modify this user",
        errorUpdate: true
      })
    }
    const {name,email,password} = req.body;
    if(!name && !email && !password) {
      return res.status(404).json({
        message: "Nothing to update",
        errorUpdate: true
      })
    }
    
    const dataToUpdate = {};
    if(name) {
      dataToUpdate.name = name
    }
    if(email) {
      if(!validator.validEmail(email)) {
        return res.status(400).json({
          message: 'invalid email'
        })
      }
      dataToUpdate.email = email
    }
    if(password) {
      if(!validator.validPassword(password)) {
        return res.status(400).json({
          message: 'invalid password, please enter a password with 6 or more charachters'
        })
      }
      const encryptPassword = sha1(password)
      dataToUpdate.password = encryptPassword
    }
    dataToUpdate.updated = Date.now()
    const query = {
      _id: {$eq: userId}
    }
    const update = {
      $set : dataToUpdate
    }
    const user = await User.findOneAndUpdate(query,update,{new:true});
    if(!user) {
      return res.status(404).json({
        message: "Can't find this user",
        errorUpdate: true
      })
    }
    return res.json({
      message: 'User update successfully',
      errorUpdate: false,
      user: user
    })
  }catch(error) {
    console.error(error.message)
    return res.status(500).json({
      message: 'Internal Server Error',
      errorUpdate: true,
      errorMessage: error.message
    })
  }
})


/**
 * @route   DELETE api/user/:userId
 * @desc    Delete a user
 * @access  Private
 */
router.delete('/:userId',auth, async (req,res) => {
  try {
    const userLogged = req.user;
    const {userId} = req.params;
    if(userLogged.id !== userId) {
      return res.status(403).json({
        message: "Permisions denied, can't delete this user",
        errorDelete: true
      })
    }
    const query = {
      $and: [
        {_id: {$eq: userId}},
        {active: {$eq: true}}
      ]
    }
    const update = {
      $set:{
        active: false
      }
    }
    const user = await User.findOneAndUpdate(query,update,{new:true})
    if(!user) {
      return res.status(404).json({
        message: "Can't find this user",
        errorDelete: true
      })
    }
    return res.json({
      message: 'User successfully deleted',
      errorDelete: false,
      user: user
    })
  } catch (error) {
    console.error(error.message)
    return res.status(500).json({
      message: 'Internal Server Error',
      errorUpdate: true,
      errorMessage: error.message
    })
  }
})

/**
 * @route     POST api/users/signin
 * @desc      Sign in
 * @access    Public
 */
router.post('/signin', async (req,res) => {
  try {
    const {body} = req;
    const {email,password} = body;
    if(!email || !password) {
      return res.status(400).json({
        message: 'email and password are required for login',
        login: false
      })
    }
    const encryptPassword = sha1(password)
    const query = {email: { $eq: email }}
    const user = await  User.findOne(query);
    if(!user) {
      return res.status(400).json({
        message: 'User not found',
        login: false
      })
    }
    const userPassword = user.password;
    if(encryptPassword !== userPassword) {
      return res.status(400).json({
        message: 'Invalid password',
        login: false
      })
    }
    else {
      const id = user.id
      const payload = {
        user: {
          id: id,
          email : email,
          password: encryptPassword,
          admin: false
        }
      }
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {expiresIn: 3600},
        (err,token) => {
          if(err) throw err;
          res.status(201).json({
            message: 'User sign succesfully',
            id: id,
            token: token
          });
        }
      )
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      message: error.message
    })
  }
})

 module.exports = router