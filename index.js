const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const Auth_routes = require("./routes/Auth_routes");
require('dotenv').config()



const app = express()
app.use(express.json());
app.use(bodyParser.json()); 
app.use(cors())

app.use('/api/auth',Auth_routes);
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`))
   .on('error', (err) => console.error("Erreur lors du démarrage du serveur:", err));
