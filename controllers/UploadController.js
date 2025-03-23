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

// ✅ Vérification du type de fichier
const validTypes = ["company_logo", "profile_image", "CV"];
if (!validTypes.includes(type)) {
  return res.status(400).json({ error: "Type de fichier invalide" });
}

// ✅ Vérification que `userId` est bien fourni
if (!userId) {
  return res.status(400).json({ error: "L'ID utilisateur est requis" });
}

// 📌 Définition du chemin de stockage
const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;

// ✅ Vérification si `file.buffer` existe
if (!file.buffer) {
  return res.status(500).json({ error: "Le fichier n'a pas été correctement traité" });
}
console.log("Envoi du fichier a Supabase...")
    // const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;
    console.log("file.buffer exists:", Boolean(file.buffer));

    // 🔹 Envoi à Supabase Storage
    const { data, error } = await supabase.storage.from("jobboard_media").upload(filePath, file.buffer,
   
     {
     contentType: file.mimetype, // Ajoute le type MIME pour éviter des erreurs
  cacheControl: "3600",
  upsert: false,//Empêche d’écraser un fichier existant
    });
    
    if (error) {
      console.error("Erreur Supabase:", error.message)
      return res.status(500).json({ error: error.message });
    }
    console.log("data send avec success", data);
      

    // 🔹 URL publique du fichier
    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/jobboard_media/${filePath}`;

    // 🔹 Sauvegarde dans PostgreSQL selon le type
    if (type === "profile_image") {
      await prisma.user.update({ where: { id: userId }, data: { picture: fileUrl } });
      
    } else if (type === "company_logo") {
      const company = await prisma.company.findUnique({ where: { userId } });
      if (!company){
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      await prisma.company.update({ where: { id: company.id }, data: { logo: fileUrl } });
    } else if (type === "CV") {
      await prisma.application.updateMany({
        where: { userId },
        data: { cv_url: fileUrl }
      });
    }

    return res.status(200).json({ message: "Fichier uploadé avec succès", url: fileUrl });
  } catch (error) {
    console.error("❌ Erreur lors de l’upload du média:", error);
    return res.status(500).json({ message: "Erreur lors de l'ajout du média", erreur: error });
  }
};

module.exports = { uploadData };