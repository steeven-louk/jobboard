const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const Register = async (req, res) => {
    const { email, password, fullName } = req.body;
    const saltRounds = 10;

    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "Tous les champs sont requis" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ message: "L'utilisateur existe déjà" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
            }
        });

        return res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

const Login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        return res.status(200).json({ message: "Connexion réussie", token, username: user.fullName });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

module.exports = { Register, Login };
