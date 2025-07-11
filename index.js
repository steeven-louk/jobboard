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

const uploadRoute = require("./routes/UploadRoute");
const webhookRouter = require("./routes/stripe/webhook");
const paymentRouter = require("./routes/stripe/paymentRoutes");


const FRONTEND_URL = process.env.NODE_ENV === "production" ? process.env.PROD_FRONTEND_URL : process.env.FRONTEND_URL;

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
app.use(express.json({ limit: "50mb" })); 
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

app.use((err, req, res, next) => {
  console.error("❌ Erreur du serveur :", err.stack); // Log l'erreur complète pour le débogage

  // Envoie une réponse d'erreur générique au client en production pour des raisons de sécurité
  // En développement, vous pouvez envoyer plus de détails pour faciliter le débogage.
  res.status(err.statusCode || 500).json({
    message: err.message || "Une erreur interne du serveur s'est produite.",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.get('/health', (req, res) => {
  console.log("✅ Health check requested.");
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(), // Temps d'exécution du processus en secondes
    timestamp: new Date().toISOString()
  });
});

// --- Gestion des Erreurs (Middleware de fin) ---
// Ce middleware attrape toutes les erreurs non gérées par les routes précédentes.
app.use((err, req, res, next) => {
  console.error("❌ Erreur du serveur (middleware global) :", err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || "Une erreur interne du serveur s'est produite.",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// --- Gestion des erreurs non capturées (Unhandled Rejections & Uncaught Exceptions) ---
// Ces gestionnaires sont CRUCIAUX pour déboguer les arrêts inattendus de l'application.
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur : Unhandled Rejection at:', promise, 'reason:', reason);
  // Arrêter l'application de manière forcée après avoir loggué l'erreur
  // En production, vous pourriez vouloir envoyer une alerte et laisser le processus se terminer
  // pour que le gestionnaire de processus (comme Railway) le redémarre.
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erreur : Uncaught Exception at:', err);
  // Arrêter l'application de manière forcée
  process.exit(1);
});

// --- Démarrage du Serveur ---
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur le port ${port} en mode ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL autorisé: ${FRONTEND_URL}`);
}).on('error', (err) => {
  console.error("❌ Erreur lors du démarrage du serveur:", err);
  process.exit(1); // Arrête le processus en cas d'erreur de démarrage
});

// --- Déconnexion propre de Prisma lors de l'arrêt du serveur ---
const gracefulShutdown = async () => {
  console.log("👋 Signal de terminaison reçu. Fermeture du serveur et déconnexion de Prisma...");
  server.close(async () => {
    console.log("🛑 Serveur Express fermé.");
    await prisma.$disconnect();
    console.log("✅ Prisma déconnecté.");
    process.exit(0);
  });

  // Forcer l'arrêt si la fermeture prend trop de temps
  setTimeout(() => {
    console.error("❌ Fermeture forcée : Le serveur n'a pas pu se fermer proprement.");
    process.exit(1);
  }, 10000); // 10 secondes de délai
};

process.on('SIGTERM', gracefulShutdown); // Gère le signal SIGTERM (utilisé par Railway pour arrêter les conteneurs)
process.on('SIGINT', gracefulShutdown);  // Gère Ctrl+C

// const port = process.env.PORT || 5000;

// app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`))
//    .on('error', (err) => console.error("Erreur lors du démarrage du serveur:", err));