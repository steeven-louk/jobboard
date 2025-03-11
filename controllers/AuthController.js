const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const Register = async (req, res) => {
    const { email, password, fullName, phone, city, birthdate, role } = await req.body;
    const saltRounds = 10;

      // Calculer l'âge
  const birthDateObj = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDateObj.getFullYear() - (today < new Date(today.getFullYear(), birthDateObj.getMonth(), birthDateObj.getDate()) ? 1 : 0);

  // Vérifier l'âge en fonction du rôle
  if (role === "USER" && age < 15) {
    return res.status(400).json({ message: "Vous devez avoir au moins 15 ans pour être candidat." });
  }
  if (role === "RECRUITER" && age < 18) {
    return res.status(400).json({ message: "Vous devez avoir au moins 18 ans pour être recruteur." });
  }

    try {
        if (!email || !password || !fullName || !phone || !city) {
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
                phone,
                city,
                picture:"",
                birthdate:birthDateObj,
                role
            }
        });

        return res.status(201).json({ message: "Utilisateur créé avec succès", user: newUser });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        return res.status(500).json({ message: "Erreur interne du serveur", error:error });
    }
}

const Login = async (req, res) => {
    const { email, password } = await req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const user = await prisma.user.findUnique({ where: { email },include:{company:{select:{id:true}}}});
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants invalides" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, companyId:user.role==="RECRUITER"? user?.company?.id :"" },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        return res.status(200).json({ message: "Connexion réussie", token, 
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                companyId: user.company?.id || null
            }
         });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

module.exports = { Register, Login };
