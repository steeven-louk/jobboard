/**
 * @file middlewares/auth.js
 * @description Middlewares pour la vérification des tokens JWT et l'autorisation basée sur les rôles.
 */

// Charge les variables d'environnement (assurez-vous que dotenv est configuré dans app.js)
require('dotenv').config();

const jwt = require('jsonwebtoken');
const { PrismaClient } = require("@prisma/client");

// Initialise Prisma Client une seule fois pour toute l'application
const prisma = new PrismaClient();

// Récupère le secret JWT depuis les variables d'environnement
// Il est crucial que ce secret soit fort et gardé secret.
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @function verifyToken
 * @description Middleware pour vérifier la validité d'un token JWT.
 * Attache le payload décodé du token à `req.user`.
 * Si l'utilisateur est un recruteur, récupère et attache également l'ID de sa company.
 *
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 * @param {function} next - La fonction next pour passer au middleware suivant.
 * @returns {void}
 */
const verifyToken = async (req, res, next) => {
    // Récupère le token de l'en-tête Authorization (format "Bearer TOKEN")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Accès refusé : Token manquant ou mal formaté." });
    }

    const token = authHeader.split(' ')[1]; // Extrait le token après "Bearer "

    if (!token) {
        return res.status(401).json({ message: "Accès refusé : Token manquant." });
    }

    try {
        // jwt.verify() vérifie la signature du token et son expiration.
        // Si le token est invalide ou expiré, une erreur sera levée.
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attache le payload décodé à l'objet `req.user`
        req.user = decoded;

        // Si l'utilisateur est un recruteur, récupérer l'ID de sa company
        if (req.user.role === "RECRUITER") {
            // Utilise l'ID de l'utilisateur décodé pour trouver l'utilisateur et sa company
            const recruiter = await prisma.user.findUnique({
                where: { id: req.user.id }, // Assurez-vous que `req.user.id` est le bon champ pour l'ID utilisateur
                select: { company: { select: { id: true } } }, // Récupère uniquement l'ID de la company
            });

            if (recruiter && recruiter.company) {
                req.user.companyId = recruiter.company.id; // Attache l'ID de la company à l'objet utilisateur
            } else {
                // Optionnel: Gérer le cas où un recruteur n'a pas de company associée (peut-être une erreur de données)
                console.warn(`Recruteur ${req.user.id} trouvé mais sans company associée.`);
                // Vous pouvez choisir de renvoyer une erreur ou de laisser companyId indéfini
            }
        }

        next(); // Passe au middleware ou à la route suivante
    } catch (error) {
        // Gestion plus spécifique des erreurs JWT
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expiré. Veuillez vous reconnecter." });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ message: "Token invalide. Accès non autorisé." });
        }
        // Pour toute autre erreur inattendue
        console.error("❌ Erreur de vérification du token :", error);
        return res.status(500).json({ message: "Erreur interne du serveur lors de l'authentification." });
    }
};

/**
 * @function verifyRole
 * @description Middleware pour vérifier si l'utilisateur a l'un des rôles autorisés.
 * Doit être utilisé après `verifyToken`.
 *
 * @param {string[]} roles - Un tableau de chaînes de caractères représentant les rôles autorisés (ex: ['ADMIN', 'RECRUITER']).
 * @returns {function} Un middleware Express.
 */
const verifyRole = (roles) => {
    return (req, res, next) => {
        // Vérifie si `req.user` et `req.user.role` existent
        if (!req.user || !req.user.role) {
            console.warn("Tentative d'accès à verifyRole sans req.user ou req.user.role.");
            return res.status(403).json({ message: "Accès non autorisé : Informations utilisateur manquantes." });
        }

        // Vérifie si le rôle de l'utilisateur est inclus dans le tableau des rôles autorisés
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès non autorisé : Vous n'avez pas les permissions requises." });
        }
        next(); // Passe au middleware ou à la route suivante
    };
};

// Exporte les middlewares pour qu'ils puissent être utilisés dans les routes
module.exports = { verifyRole, verifyToken };
