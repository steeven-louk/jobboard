const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const Register = async (req, res) => {
    const { email, password, fullName, phone, city, birthdate, role } = await req.body;
    const saltRounds = 10;


    try {
        if (!email || !password || !fullName || !phone || !city) {
            return res.status(400).json({ message: "Tous les champs sont requis" });
        }

        
        // --- Calcul et validation de l'âge ---
        const birthDateObj = new Date(birthdate);
        // Vérifie si la date de naissance est valide
        if (isNaN(birthDateObj.getTime())) {
            return res.status(400).json({ message: "Date de naissance invalide." });
        }

        const today = new Date();
        // Calcul de l'âge précis
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }

        // Vérifier l'âge en fonction du rôle
        if (role === "USER" && age < 15) {
            return res.status(400).json({ message: "Vous devez avoir au moins 15 ans pour vous inscrire en tant que candidat." });
        }
        if (role === "RECRUITER" && age < 18) {
            return res.status(400).json({ message: "Vous devez avoir au moins 18 ans pour vous inscrire en tant que recruteur." });
        }

        // --- Validation spécifique au rôle de recruteur ---
        if (role === "RECRUITER") {
            if (!companyName || !companyLocation || !description) {
                return res.status(400).json({ message: "Les informations de l'entreprise (nom, localisation, description) sont requises pour les recruteurs." });
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ message: "Un compte avec cet email existe déjà" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // const newUser = await prisma.user.create({
        //     data: {
        //         fullName,
        //         email,
        //         password: hashedPassword,
        //         phone,
        //         city,
        //         picture:"",
        //         birthdate:birthDateObj,
        //         role
        //     }
        // });
         let newUser;
        if (role === "RECRUITER") {
            // Création de l'entreprise et de l'utilisateur recruteur
            newUser = await prisma.user.create({
                data: {
                    fullName,
                    email,
                    password: hashedPassword,
                    phone,
                    city,
                    birthdate: birthDateObj,
                    role,
                    picture: null, // Défini à null par défaut, peut être mis à jour plus tard
                    company: {
                        create: { // Crée une nouvelle entreprise liée à ce recruteur
                            name: companyName,
                            location: companyLocation,
                            description: description,
                            logo: null, // Défini à null par défaut
                            domaine: "Non spécifié", // Valeur par défaut si non fourni
                        }
                    }
                },
                include: { company: true } // Inclure l'entreprise créée dans la réponse
            });
        } else {
            // Création d'un utilisateur candidat
            newUser = await prisma.user.create({
                data: {
                    fullName,
                    email,
                    password: hashedPassword,
                    phone,
                    city,
                    birthdate: birthDateObj,
                    role,
                    picture: null, // Défini à null par défaut
                }
            });
        }

        return res.status(201).json({ message:"Inscription réussie ! Votre compte a été créé.", user: newUser });
    } catch (error) {
        console.error("❌ Erreur lors de l'inscription :", error);
        // Gérer les erreurs spécifiques de Prisma si nécessaire
        if (error.code === 'P2002') { // Erreur de violation de contrainte unique (ex: email déjà utilisé)
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de l'inscription.",
            error: error.message // Fournir le message d'erreur pour le débogage en dev
        });
    }
}

const Login = async (req, res) => {
    const { email, password } = await req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const user = await prisma.user.findUnique({ 
            where: { email },
            include:{
                company:{
                    select:{
                        id:true
                    }
                }
            }
        });
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const token = jwt.sign(
            {
                id: user.id, 
                role: user.role, 
                companyId: user.role==="RECRUITER"? (user?.company ? user.company.id : null): null },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        return res.status(200).json({ 
            message: "Connexion réussie", 
            token, 
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                companyId: user.company?.id || null
            }
         });
    } catch (error) {
         console.error("❌ Erreur lors de la connexion :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la connexion.",
            error: error.message 
        });
    }
}

module.exports = { Register, Login };
