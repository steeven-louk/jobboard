const { PrismaClient } = require('@prisma/client');
const { supabase } = require("../utils/supabase");

const prisma = new PrismaClient();

const uploadData = async (req, res) => {
  try {
    const { type, userId } = req.params;
    const file = req.file;

    console.log("📂 Fichier reçu:", file);

    if (!file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }
    // Vérification si `file.buffer` existe
    if (!file.buffer) {
      return res.status(500).json({ error: "Le fichier n'a pas été correctement traité" });
    }

// Vérification du type de fichier
const validTypes = ["company_logo", "profile_image", "CV"];
if (!validTypes.includes(type)) {
  return res.status(400).json({ message: `Type de fichier invalide: ${type}. Types autorisés: ${validTypes.join(', ')}.` });
}

// Vérification que `userId` est bien fourni
if (!userId) {
  return res.status(400).json({ error: "L'ID utilisateur est requis" });
}

// Définition du chemin de stockage
const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;
console.log("Chemin de stockage Supabase:", filePath);

console.log("Envoi du fichier a Supabase...")

    // Envoi à Supabase Storage
    const { data, error: uploadError } = await supabase.storage.from("jobboard_media")
    .upload(filePath, file.buffer,
     {
     contentType: file.mimetype, // Ajoute le type MIME pour éviter des erreurs
     cacheControl: "3600",
     upsert: false,//Empêche d’écraser un fichier existant
    });
    
    if (uploadError) {
      console.error("Erreur Supabase:", uploadError.message)
      return res.status(500).json({
        message: "Erreur lors du téléchargement du fichier vers le stockage.",
        error: uploadError.message });
    }
    console.log("Fichier envoyé avec success", data);
      

    // URL publique du fichier
    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/jobboard_media/${filePath}`;

    // Sauvegarde dans PostgreSQL selon le type
    if (type === "profile_image") {
      await prisma.user.update({ 
        where: { id: userId }, 
        data: { picture: fileUrl } 
      });
      
    } else if (type === "company_logo") {
        if (userRole !== "RECRUITER" || !companyIdFromToken) {
          // Cela ne devrait pas arriver si les middlewares sont corrects, mais c'est une sécurité
          return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs avec une entreprise associée peuvent uploader un logo." });
        }

          // Vérifier si l'entreprise existe et appartient à ce recruteur (double vérification)
        const company = await prisma.company.findUnique({
            where: { id: companyIdFromToken, userId: userId } // userId ici est l'ID du recruteur propriétaire
         });

        if (!company) {
          return res.status(404).json({ message: "Entreprise non trouvée ou non associée à votre compte." });
        }


      await prisma.company.update({ 
        where: { id: company.id }, 
        data: { logo: fileUrl } });
    } else if (type === "CV") {
      await prisma.application.updateMany({
        where: { userId },
        data: { cv_url: fileUrl }
      });
    }

    return res.status(200).json({ 
      message: "Fichier téléchargé avec succès", 
      url: fileUrl 
    });
  }catch (error) {
        console.error("❌ Erreur lors de l'upload du média :", error);
        // Gérer les erreurs spécifiques de Prisma si nécessaire (ex: ID non trouvé pour update)
        if (error.code === 'P2025') { // Record not found (si userId ou companyId n'existe pas)
            return res.status(404).json({ message: "Ressource cible non trouvée pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de l'upload du média.",
            error: error.message // Fournir le message d'erreur pour le débogage en dev
        });
    }
};

module.exports = { uploadData };