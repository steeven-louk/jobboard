const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const createRecruiter = async (req, res) => {
  try {
    const { 
      email, password, fullName, phone, city, birthdate, 
      companyName, companyLocation, website, description,employeeCount
    } = req.body;

    // Vérifier si tous les champs obligatoires sont remplis
    if (!email || !password || !fullName || !phone || !city || !birthdate || !companyName || !companyLocation) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires (informations personnelles et d'entreprise) sont requis." });
    }

        // --- Validation de la date de naissance et de l'âge ---
        const birthDateObj = new Date(birthdate);
        if (isNaN(birthDateObj.getTime())) {
            return res.status(400).json({ message: "Date de naissance invalide." });
        }

        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }

        if (age < 18) {
            return res.status(400).json({ message: "Vous devez avoir au moins 18 ans pour vous inscrire en tant que recruteur." });
        }

        // --- Vérifier si l'utilisateur existe déjà ---
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte." });
        }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le recruteur avec l'entreprise associée
    const recruiter = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        city,
        birthdate: birthDateObj,
        role: "RECRUITER", 
        picture: null,
        // Vérification et création de l'entreprise
        company: {
          create: {
              name: companyName,
              location: companyLocation,
              // Assurer que les champs optionnels sont null si non fournis ou vides
              website: website && website.trim() !== '' ? website : null,
              description: description && description.trim() !== '' ? description : null,
              employeeCount: employeeCount !== undefined ? parseInt(employeeCount, 10) : null, // Convertir en entier, null si non fourni
              logo: null, // Défini à null par défaut
              domaine: "Non spécifié", // Valeur par défaut si non fourni
          },
        },
      },
      include: {
        company: true,
      },
    });

    res.status(201).json({ 
      message: "Compte recruteur créé avec succès.", recruiter });
  } catch (error) {
        console.error("❌ Erreur lors de la création du compte recruteur :", error);
        // Gérer les erreurs spécifiques de Prisma
        if (error.code === 'P2002') { // Erreur de violation de contrainte unique (ex: email déjà utilisé)
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }
        // Gérer les erreurs de validation de données (ex: type incorrect pour employeeCount)
        if (error.code === 'P2003' || error.code === 'P2007' || error.code === 'P2025') {
            return res.status(400).json({ message: "Erreur de données : Vérifiez les informations fournies.", error: error.message });
        }
        res.status(500).json({
            message: "Erreur interne du serveur lors de la création du compte recruteur.",
            error: error.message // Fournir le message d'erreur pour le débogage en dev
        });
    }
};

module.exports = { createRecruiter };
