// const { PrismaClient } = require('@prisma/client');

// const { supabase } = require("../utils/supabase");

// const prisma = new PrismaClient();

// const uploadData = async (req, res) => {
//   try {
//     const { type, userId } = req.params;
//     const file = req.file;

//     console.log("📂 Fichier reçu:", file);

//     if (!file) {
//       return res.status(400).json({ error: "Aucun fichier fourni" });
//     }
//     // Vérification si `file.buffer` existe
//     if (!file.buffer) {
//       return res.status(500).json({ error: "Le fichier n'a pas été correctement traité" });
//     }

// // Vérification du type de fichier
// const validTypes = ["company_logo", "profile_image", "CV"];
// if (!validTypes.includes(type)) {
//   return res.status(400).json({ message: `Type de fichier invalide: ${type}. Types autorisés: ${validTypes.join(', ')}.` });
// }

// // Vérification que `userId` est bien fourni
// if (!userId) {
//   return res.status(400).json({ error: "L'ID utilisateur est requis" });
// }

// // Définition du chemin de stockage
// const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;
// console.log("Chemin de stockage Supabase:", filePath);

// console.log("Envoi du fichier a Supabase...")

//     // Envoi à Supabase Storage
//     const { data, error: uploadError } = await supabase.storage.from("jobboard_media")
//     .upload(filePath, file.buffer,
//      {
//      contentType: file.mimetype, // Ajoute le type MIME pour éviter des erreurs
//      cacheControl: "3600",
//      upsert: false,//Empêche d’écraser un fichier existant
//     });
    
//     if (uploadError) {
//       console.error("Erreur Supabase:", uploadError.message)
//       return res.status(500).json({
//         message: "Erreur lors du téléchargement du fichier vers le stockage.",
//         error: uploadError.message });
//     }
//     console.log("Fichier envoyé avec success", data);
      

//     // URL publique du fichier
//     const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/jobboard_media/${filePath}`;

//     // Sauvegarde dans PostgreSQL selon le type
//     if (type === "profile_image") {
//       await prisma.user.update({ 
//         where: { id: userId }, 
//         data: { picture: fileUrl } 
//       });
      
//     } else if (type === "company_logo") {
//         if (userRole !== "RECRUITER" || !companyIdFromToken) {
//           // Cela ne devrait pas arriver si les middlewares sont corrects, mais c'est une sécurité
//           return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs avec une entreprise associée peuvent uploader un logo." });
//         }

//           // Vérifier si l'entreprise existe et appartient à ce recruteur (double vérification)
//         const company = await prisma.company.findUnique({
//             where: { id: companyIdFromToken, userId: userId } // userId ici est l'ID du recruteur propriétaire
//          });

//         if (!company) {
//           return res.status(404).json({ message: "Entreprise non trouvée ou non associée à votre compte." });
//         }


//       await prisma.company.update({ 
//         where: { id: company.id }, 
//         data: { logo: fileUrl } });
//     } else if (type === "CV") {
//       await prisma.application.updateMany({
//         where: { userId },
//         data: { cv_url: fileUrl }
//       });
//     }

//     return res.status(200).json({ 
//       message: "Fichier téléchargé avec succès", 
//       url: fileUrl 
//     });
//   }catch (error) {
//         console.error("❌ Erreur lors de l'upload du média :", error);
//         // Gérer les erreurs spécifiques de Prisma si nécessaire (ex: ID non trouvé pour update)
//         if (error.code === 'P2025') { // Record not found (si userId ou companyId n'existe pas)
//             return res.status(404).json({ message: "Ressource cible non trouvée pour la mise à jour." });
//         }
//         return res.status(500).json({
//             message: "Erreur interne du serveur lors de l'upload du média.",
//             error: error.message // Fournir le message d'erreur pour le débogage en dev
//         });
//     }
// };

// module.exports = { uploadData };

/**
 * @file controllers/UploadController.js
 * @description Contrôleur pour la gestion du téléchargement de fichiers
 * vers Supabase Storage et la mise à jour des URLs dans la base de données.
 */

const { PrismaClient } = require('@prisma/client');
const { supabase } = require("../utils/supabase"); // Assurez-vous que ce chemin est correct et que 'supabase' est bien exporté.

const prisma = new PrismaClient();

/**
 * @function uploadData
 * @description Gère le téléchargement d'un fichier (image de profil, logo d'entreprise, CV)
 * vers Supabase Storage et met à jour l'URL correspondante dans la base de données.
 *
 * @param {object} req - L'objet requête Express.
 * Contient `req.params.type` (type de fichier), `req.user.id` (ID de l'utilisateur authentifié),
 * et `req.file` (le fichier téléchargé par Multer).
 * @param {object} res - L'objet réponse Express.
 * @returns {Promise<void>} Une promesse qui résout sans valeur ou rejette avec une erreur.
 */
const uploadData = async (req, res) => {
    try {
        const { type } = req.params; // Type de fichier (ex: 'profile_image', 'company_logo', 'CV')
        // CORRECTION CRITIQUE: L'ID de l'utilisateur DOIT venir du token authentifié, pas des params de l'URL.
        const userId = req.user.id; // ID de l'utilisateur authentifié via verifyToken
        const userRole = req.user.role; // Rôle de l'utilisateur authentifié
        const companyIdFromToken = req.user.companyId; // ID de l'entreprise si l'utilisateur est un recruteur

        const file = req.file; // Fichier traité par Multer

        console.log("📂 Fichier reçu pour upload. Type:", type, "Utilisateur ID:", userId);

        // --- Validation initiale du fichier ---
        if (!file) {
            return res.status(400).json({ message: "Aucun fichier fourni." });
        }
        if (!file.buffer) {
            return res.status(500).json({ message: "Le fichier n'a pas été correctement traité (buffer manquant)." });
        }

        // --- Validation du type de fichier ---
        const validTypes = ["company_logo", "profile_image", "CV"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: `Type de fichier invalide: ${type}. Types autorisés: ${validTypes.join(', ')}.` });
        }

        // --- Définition du chemin de stockage dans Supabase ---
        // Utilise l'ID de l'utilisateur authentifié pour le chemin, pas celui des params.
        const filePath = `${type}/${userId}-${Date.now()}-${file.originalname}`;
        console.log("Chemin de stockage Supabase:", filePath);

        // --- Envoi du fichier à Supabase Storage ---
        console.log("Envoi du fichier à Supabase Storage...");
        const { data, error: uploadError } = await supabase.storage
        .from("jobboard_media")
        .upload(
            filePath,
            file.buffer,
            {
                contentType: file.mimetype, // Type MIME du fichier
                cacheControl: "3600", // Cache pour 1 heure
                upsert: true, // écraser un fichier existant avec le même chemin
            }
        );
        let fileUrl =""
        if (uploadError) {
            console.error("❌ Erreur Supabase lors de l'upload :", uploadError.message);
            return res.status(500).json({
                message: "Erreur lors du téléchargement du fichier vers le stockage.",
                error: uploadError.message
            });
        } else{
          // recupérer l'url publique
          const {data:publicUrlData} = supabase.storage.from('jobboard_media')
          .getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl
        }
        console.log("Fichier envoyé à Supabase avec succès. Données:", data);

        // --- Génération de l'URL publique du fichier ---
        // const fileUrl  = `${process.env.SUPABASE_URL}/storage/v1/object/public/jobboard_media/${filePath}`;
        console.log("URL publique du fichier:", fileUrl);

        // --- Sauvegarde de l'URL dans la base de données PostgreSQL (via Prisma) ---
        if (type === "profile_image") {
            // Mise à jour de l'image de profil de l'utilisateur
            await prisma.user.update({
                where: { id: userId },
                data: { picture: fileUrl }
            });
        } else if (type === "company_logo") {
            // Mise à jour du logo de l'entreprise
            // Vérification que l'utilisateur est un recruteur et qu'il a une companyId
            if (userRole !== "RECRUITER" || !companyIdFromToken) {
                return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs avec une entreprise associée peuvent uploader un logo." });
            }

            // si l'entreprise existe et appartient à ce recruteur (double vérification)
            const company = await prisma.company.findUnique({
                where: { id: companyIdFromToken, userId: userId } // userId ici est l'ID du recruteur propriétaire
            });

            if (!company) {
                return res.status(404).json({ message: "Entreprise non trouvée ou non associée à votre compte." });
            }

            await prisma.company.update({
                where: { id: company.id },
                data: { logo: fileUrl }
            });
        } 

        // --- Réponse de succès ---
        return res.status(200).json({
            message: "Fichier téléchargé et enregistré avec succès.",
            fileUrl: fileUrl 
        });
    } catch (error) {
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
