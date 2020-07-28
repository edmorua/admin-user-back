require('dotenv').config({"path": `.env.${process.env.NODE_ENV}`})

const express = require('express')
const PORT = process.env.PORT
const SERVER_HOST = process.env.SERVER_HOST
const DB_HOST = process.env.DB_HOST
const user = require('./routes/user');
const app = express()
const ConnectDB = require('./db/db')


ConnectDB(DB_HOST)

app.use(express.json({extended:false}))

app.get('/', (req,res) => res.send('Api Running'));

/**
 * Route to handler the user api request.
 */
app.use('/api/users',user)

app.listen(PORT, () => console.log(`app listening at http://${SERVER_HOST}:${PORT}`));
