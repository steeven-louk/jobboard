// import express from "express";
// import upload from "../middleware/upload.js";
// const supabase = require("../utils/supabase.js");
const { PrismaClient } = require('@prisma/client');
const { supabase } = require("../utils/supabase");
// import prisma from "../utils/prisma.js"; // Assure-toi d’avoir la config Prisma
const prisma = new PrismaClient();


// 🔹 Upload fichier
 const uploadData = async (req, res) => {
  const { type, userId } = await req.params;
  const file = await req.file;
    try {
        
  console.log("fileee", file);
  console.log("reqqqq", req.file);
  if (!file) return res.status(400).json({ error: "Aucun fichier fourni" });
console.log("folderr", type);
const validTypes = ["company_logo", "profile_image", "CV"];
if (!validTypes.includes(type)) return res.status(400).json({ error: "Type de fichier invalide" });

// Définir le chemin de stockage
const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;
console.log("reqqqq",filePath);

  // 🔹 Envoi à Supabase Storage
  const { data, error } = await supabase.storage.from("jobboard_media").upload(filePath, file.buffer, {
    cacheControl: "3600",
    upsert: false,
  });
console.log("supa data", data);
  if (error) return res.status(500).json({ error: error.message });

  // URL publique du fichier
  const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/jobboard_media/${filePath}`;

  // 🔹 Sauvegarde dans PostgreSQL selon le type
  if (type === "profile_image") {
    await prisma.user.update({ where: { id: userId }, data: { picture: fileUrl } });
  } else if (type === "company_logo") {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) return res.status(404).json({ error: "Entreprise non trouvée" });

    await prisma.company.update({ where: { id: company.id }, data: { logo: fileUrl } });
  } else if (type === "CV") {
    await prisma.user.update({
         where: { id: userId },
         include:{applications:true}, 
         data: { applications:{cv_url: fileUrl} } });
  } 
//   else if (type === "lm") {
//     await prisma.user.update({ where: { id: userId }, data: { lm: fileUrl } });
//   }

  res.json({ url: fileUrl });
    } catch (error) {
        console.log('error:',error);
        return res.status(500).json({message:"Erreur lors de l'ajout du media", erreur:error});
    }
};

// 🔹 Suppression de fichier
// router.delete("/", async (req, res) => {
//   const { fileUrl, userId } = req.body;

//   if (!fileUrl) return res.status(400).json({ error: "URL du fichier requis" });

//   // 🔹 Récupération du chemin
//   const filePath = fileUrl.split("/storage/v1/object/public/bucket-name/")[1];

//   const { error } = await supabase.storage.from("bucket-name").remove([filePath]);

//   if (error) return res.status(500).json({ error: error.message });

//   // 🔹 Mise à jour PostgreSQL
//   await prisma.user.update({
//     where: { id: userId },
//     data: { picture: null },
//   });

//   res.json({ message: "Fichier supprimé" });
// });

module.exports = {uploadData};
