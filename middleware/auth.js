const jwt = require('jsonwebtoken');

//require('dotenv').config({"path": `../.env.${process.env.NODE_ENV}`})

const auth = (req,res,next) => {
  const headers = req.headers;
  const {authorization} = headers;
  if(authorization) {
    const token = authorization.replace('Bearer ',"");
    if(!token) {
      return res.status(401).json({message: 'No token, authorization denid', token: null});
    }
    try {
      const decode = jwt.verify(token,process.env.JWT_SECRET);
      req.user = decode.user;
      next();
    } catch(error) {
      console.error(error.message);
      return res.status(401).json({message: 'Token is not valid'});
    }
  }
  else {
    return res.status(401).json({message: 'No athorization header found'});
  }
}

module.exports = auth;