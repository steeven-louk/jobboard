require('dotenv').config();
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
const webhookRouter = require("./routes/stripe/webhook");
const paymentRouter = require("./routes/stripe/paymentRoutes");


// Configuration de Supabase
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configurer Multer pour l'upload temporaire
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
const FRONTEND_URL = process.env.NODE_ENV === "production" ? process.env.PROD_FRONTEND_URL : process.env.FRONTEND_URL;
const DATABASE_URL = process.env.NODE_ENV === "production" ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL;

const app = express()
// ✅ Configuration correcte de CORS
const corsOptions = {
   origin: FRONTEND_URL, // ✅ Autorise uniquement ton frontend
   methods: "GET,POST,PUT,DELETE,OPTIONS",
   allowedHeaders: "Content-Type, Authorization",
   credentials: true, // ✅ Permet les cookies & JWT
 };

 
 app.use(cors(corsOptions));
 
 // ✅ Middleware pour forcer les bons headers CORS
 app.use((req, res, next) => {
   res.header("Access-Control-Allow-Origin", FRONTEND_URL);
   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
   res.header("Access-Control-Allow-Credentials", "true");
 
   if (req.method === "OPTIONS") {
     return res.sendStatus(200);
   }
   next();
 });

 

app.use('/api/stripe',express.raw({ type: "application/json" }), webhookRouter);
app.use(express.json({ limit: "50mb" })); // Pour JSON
app.use(express.urlencoded({ limit: "50mb", extended: true })); 

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth',Auth_routes);
app.use('/api/user',application_Route);
app.use('/api/user',userRouter);
app.use('/api/auth',recruterRoute);
app.use('/api', job_Route);
app.use('/api/company', company_router);
app.use('/api/upload', uploadRoute);
app.use('/api/payment', paymentRouter);

app.use("/", (_,res)=> res.send("welcome to the server home page"))
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`))
   .on('error', (err) => console.error("Erreur lors du démarrage du serveur:", err));