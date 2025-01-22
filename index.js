const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
require('dotenv').config()



const app = express()
bodyParser.json();
const port = 5000 || process.env.PORT
console.log(process.env.PORT)

app.listen(()=> console.log("serveur est lancer au port", port))