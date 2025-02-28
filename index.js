const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const Auth_routes = require("./routes/Auth_routes");
const job_Route = require("./routes/Job_routes");
const application_Route = require("./routes/Application_routes");
const userRouter = require("./routes/User_routes");
const recruterRoute = require("./routes/RecruiterRoutes");
const company_router = require("./routes/Company_routes");
// const { createClient } = require("@supabase/supabase-js");
// const multer = require("multer");
const uploadRoute = require("./routes/UploadRoute");

require('dotenv').config()

// Configuration de Supabase
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configurer Multer pour l'upload temporaire
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json()); 

app.use('/api/auth',Auth_routes);
app.use('/api/user',application_Route);
app.use('/api/user',userRouter);
app.use('/api/auth',recruterRoute);
app.use('/api', job_Route);
app.use('/api/company', company_router);
app.use('/api/upload', uploadRoute);


const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`))
   .on('error', (err) => console.error("Erreur lors du démarrage du serveur:", err));
