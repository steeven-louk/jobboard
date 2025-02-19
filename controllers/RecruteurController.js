const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const createRecruiter = async (req, res) => {
  try {
    const { 
      email, password, fullName, phone, city, birthdate, 
      companyName, companyLocation, website, description 
    } = req.body;

    // Vérifier si tous les champs obligatoires sont remplis
    if (!email || !password || !fullName || !phone || !city || !birthdate || !companyName || !companyLocation) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }



    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
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
        birthdate: birthdate? new Date(birthdate): null,
        role: "RECRUITER", 

        // Vérification et création de l'entreprise
        company: {
          create: {
            name: companyName, // S'assurer que companyName est bien fourni
            location: companyLocation,
            website: website || null,
            description: description || null,
          },
        },
      },
      include: {
        company: true,
      },
    });

    res.status(201).json({ message: "Compte recruteur créé avec succès.", recruiter });
  } catch (error) {
    console.error("Erreur lors de la création du compte recruteur :", error);
    res.status(500).json({ message: "Erreur serveur.", error });
  }
};

module.exports = { createRecruiter };
