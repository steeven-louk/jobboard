const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getProfil =async(req,res)=>{
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({
                message:"Utilisateur non authentifié. Veuillez vous reconnecter."});
        }

        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: {id: userId},
            include:{
                Experience:{
                    orderBy: { date_debut: 'desc'}
                },
                Diplome:{
                    orderBy: { date_fin: 'desc'}
                }
            },
            omit: {
                password: true
            }
        });
        if(!user){
            return res.status(404).json({message:"Profil utilisateur non trouvé."});
        }
        return res.status(200).json({
            message: "Profil récupéré avec succès.",
            user:user
        });
    }catch (error) {
        console.error("❌ Erreur lors de la récupération du profil :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération du profil.",
            error: error.message
        });
    }
}

const updateProfile =async(req, res)=>{
    const {email,phone,sexe,fullName,birthdate,domaine,picture} =await req.body
    const userId = req.user.id;

    try {
        if(!req.user || !userId){
            return res.status(401).json({
                message:"Utilisateur non authentifié"});
        }

                // Préparer les données pour la mise à jour (permet des mises à jour partielles)
        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (sexe !== undefined) updateData.sexe = sexe;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (domaine !== undefined) updateData.domaine = domaine;
        if (picture !== undefined) updateData.picture = picture;

        // Gérer la date de naissance si elle est fournie
        if (birthdate !== undefined) {
            const parsedBirthdate = new Date(birthdate);
            if (isNaN(parsedBirthdate.getTime())) {
                return res.status(400).json({ message: "Date de naissance invalide." });
            }
            updateData.birthdate = parsedBirthdate;
        }

        const updateUser = await prisma.user.update({
            where: {id: userId},
            data: updateData,
            select: { // Sélectionne les champs à retourner après la mise à jour
                id: true, fullName: true, email: true, phone: true, city: true,
                birthdate: true, sexe: true, domaine: true, picture: true, role: true
            }
        });

        return res.status(200).json({
            message:"Profil mis à jour avec succes"
        });

    } catch (error) {
        console.error("❌ Erreur lors de la modification du profil :", error);
        // Gérer les erreurs spécifiques de Prisma (ex: email déjà utilisé, ID non trouvé)
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte." });
        }
        if (error.code === 'P2025') { // Record not found (si l'utilisateur n'existe pas)
            return res.status(404).json({ message: "Profil utilisateur non trouvé pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la modification du profil.",
            error: error.message
        });
    }
}

const updateExperience =async(req, res)=>{
    const {id} = await req.params;
    const userId = req.user.id;
    const {location,
        entreprise,
        title,
        contract,
        date_debut,
        date_fin,
        description,
        en_cours,
        competence} =await req.body;
    try {
        if(!req.user || !userId){
            return res.status(401).json({
                message:"Utilisateur non authentifié. Veuillez vous reconnecter."});
        }

        // Validation de l'ID de l'expérience
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'expérience invalide." });
        }
        const experienceId = parseInt(id, 10);
        
        // Vérifier si l'expérience existe
         const existingExperience = await prisma.experience.findUnique({
            where: { id:experienceId },
            select: {userId: true},
        });

        if (!existingExperience) {
            return res.status(404).json({ error: "Expérience non trouvée" });
        }

        if (existingExperience.userId !== userId) {
            return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez modifier que vos propres expériences." });
        }

        const updateData = {};
        if (location !== undefined) updateData.location = location;
        if (entreprise !== undefined) updateData.entreprise = entreprise;
        if (title !== undefined) updateData.title = title;
        if (contract !== undefined) updateData.contract = contract;
        if (description !== undefined) updateData.description = description;
        if (en_cours !== undefined) updateData.en_cours = en_cours; 
        if (competence !== undefined) updateData.competence = competence;

        // Gérer les dates si elles sont fournies
        if (date_debut !== undefined) {
            const parsedDateDebut = new Date(date_debut);
            if (isNaN(parsedDateDebut.getTime())) {
                return res.status(400).json({ message: "Date de début invalide." });
            }
            updateData.date_debut = parsedDateDebut;
        }
        if (date_fin !== undefined) {
            const parsedDateFin = new Date(date_fin);
            if (isNaN(parsedDateFin.getTime())) {
                return res.status(400).json({ message: "Date de fin invalide." });
            }
            updateData.date_fin = parsedDateFin;
        } else if (en_cours) {
            // Si "en_cours" est vrai, date_fin doit être null
            updateData.date_fin = null;
        }
         // Mettre à jour l'expérience
         const updatedExperience = await prisma.experience.update({
            where: { id: experienceId},
            data: updateData,
        });

        return res.status(200).json({ message: "Expérience mise à jour avec succès", updatedExperience });
    } catch (error) {
        console.error("❌ Erreur lors de la modification de l'expérience :", error);
        // Gérer les erreurs spécifiques de Prisma (ex: ID non trouvé)
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Expérience non trouvée pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la modification de l'expérience.",
            error: error.message
        });
    }
}

const updateDiplome = async (req, res) => {
    const { id } = req.params; // ID du diplôme à mettre à jour
    const userId = req.user.id; // ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification de l'utilisateur
        if (!req.user || !userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        // Validation de l'ID du diplôme
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID de diplôme invalide." });
        }
        const diplomeId = parseInt(id, 10);

        // --- Vérification de propriété CRITIQUE ---
        const existingDiplome = await prisma.diplome.findUnique({ // Assurez-vous que le modèle est 'Diplome' ou 'Formation'
            where: { id: diplomeId },
            select: { userId: true },
        });

        if (!existingDiplome) {
            return res.status(404).json({ message: "Diplôme non trouvé." });
        }
        if (existingDiplome.userId !== userId) {
            return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez modifier que vos propres diplômes." });
        }

        // Préparer les données pour la mise à jour (permet des mises à jour partielles)
        const { title, level, school, location, date_debut, date_fin, description, competence } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (level !== undefined) updateData.level = level;
        if (school !== undefined) updateData.school = school;
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (competence !== undefined) updateData.competence = competence; // Assurez-vous que c'est une chaîne

        // Gérer les dates si elles sont fournies
        if (date_debut !== undefined) {
            const parsedDateDebut = new Date(date_debut);
            if (isNaN(parsedDateDebut.getTime())) {
                return res.status(400).json({ message: "Date de début invalide." });
            }
            updateData.date_debut = parsedDateDebut;
        }
        if (date_fin !== undefined) {
            const parsedDateFin = new Date(date_fin);
            if (isNaN(parsedDateFin.getTime())) {
                return res.status(400).json({ message: "Date de fin invalide." });
            }
            updateData.date_fin = parsedDateFin;
        }

        // Effectuer la mise à jour
        const updatedDiplome = await prisma.diplome.update({ // Assurez-vous que le modèle est 'Diplome' ou 'Formation'
            where: { id: diplomeId },
            data: updateData,
        });

        return res.status(200).json({
            message: "Diplôme mis à jour avec succès.",
            updatedDiplome
        });
    } catch (error) {
        console.error("❌ Erreur lors de la modification du diplôme :", error);
        // Gérer les erreurs spécifiques de Prisma (ex: ID non trouvé)
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Diplôme non trouvé pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la modification du diplôme.",
            error: error.message
        });
    }
};

const addDiplome =async(req,res)=>{
    const { title, level, school, location, date_debut, date_fin, description, competence } = req.body;
    const userId = req.user.id; // ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification de l'utilisateur
        if (!req.user || !userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        // --- Validation des champs requis ---
        if (!title || !level || !school || !location || !date_debut || !date_fin || !competence) {
            return res.status(400).json({ 
                message: "Tous les champs obligatoires (titre, niveau, école, localisation, dates, compétences) sont requis pour ajouter un diplôme." 
            });
        }

        // Validation des dates
        const parsedDateDebut = new Date(date_debut);
        const parsedDateFin = new Date(date_fin);
        if (isNaN(parsedDateDebut.getTime()) || isNaN(parsedDateFin.getTime())) {
            return res.status(400).json({ message: "Dates de début ou de fin invalides." });
        }

        if (parsedDateDebut > parsedDateFin) {
            return res.status(400).json({ message: "La date de début ne peut pas être postérieure à la date de fin." });
        }

        const diplome = await prisma.formation.create({
            data: {
                userId:req.user.id,
                title,
                level,
                school,
                location,
                date_debut: parsedDateDebut,
                date_fin: parsedDateFin,
                description: description || null,
                competence
            },
        });
        return res.status(201).json({ message: "Diplome ajouter avec succès", diplome });

    } catch (error) {
        console.error("❌ Erreur lors de l'ajout du diplôme :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de l'ajout du diplôme.",
            error: error.message
        });
    }
}

const deleteDiplome =async(req,res)=>{
    const { id } = req.params; // ID du diplôme à supprimer
    const userId = req.user.id; // ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification de l'utilisateur
        if (!req.user || !userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        // Validation de l'ID du diplôme
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID de diplôme invalide." });
        }
        const diplomeId = parseInt(id, 10);

        const existingDiplome = await prisma.formation.findUnique({
            where: { id: diplomeId },
            select:  {userId: true},
        });
 
         if(!existingDiplome){
             return res.status(404).json({message:"Diplôme introuvable"});
         }
         if (existingDiplome.userId !== userId) {
            return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez supprimer que vos propres diplômes." });
        }
        await prisma.formation.delete(
            {
            where: { id: diplomeId }
        });
 
         return res.status(200).json({ 
            message: "Diplôme supprimer avec succès"
        });
 
     } catch (error) {
        console.error("❌ Erreur lors de la suppression du diplôme :", error);
        // Gérer les erreurs spécifiques de Prisma (ex: ID non trouvé)
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Diplôme non trouvé pour la suppression." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la suppression du diplôme.",
            error: error.message
        });
    }
 }

const addExperience =async(req,res)=>{
    const { location, entreprise, title, contract, date_debut, date_fin, description, en_cours, competence } = req.body;
    const userId = req.user.id; // ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification de l'utilisateur
        if (!req.user || !userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        // --- Validation des champs requis ---
        if (!location || !entreprise || !title || !contract || !date_debut || !competence) {
            return res.status(400).json({ message: "Tous les champs obligatoires (localisation, entreprise, titre, contrat, date de début, compétences) sont requis pour ajouter une expérience." });
        }

        // Validation des dates
        const parsedDateDebut = new Date(date_debut);
        if (isNaN(parsedDateDebut.getTime())) {
            return res.status(400).json({ message: "Date de début invalide." });
        }

        let parsedDateFin = null;
        if (en_cours) {
            // Si "en_cours" est vrai, la date de fin est null
            parsedDateFin = null;
        } else if (date_fin !== undefined) {
            parsedDateFin = new Date(date_fin);
            if (isNaN(parsedDateFin.getTime())) {
                return res.status(400).json({ message: "Date de fin invalide." });
            }
            if (parsedDateDebut > parsedDateFin) {
                return res.status(400).json({ message: "La date de début ne peut pas être postérieure à la date de fin." });
            }
        } else {
            // Si pas "en_cours" et date_fin est manquante, c'est une erreur
            return res.status(400).json({ message: "La date de fin est requise si l'expérience n'est pas en cours." });
        }


        const addExperience = await prisma.experience.create({
            data: {
                userId: userId,
                location,
                entreprise,
                title,
                contract,
                date_debut: parsedDateDebut,
                date_fin: parsedDateFin,
                description: description || null, // Définit à null si vide
                en_cours: en_cours || false, // Définit à false si non fourni
                competence,
            },
        });
        return res.status(201).json({ 
            message: "Expérience ajouter avec succès", addExperience });

    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Erreur lors de l'ajout de l'experience", error:error})
    }
}

const deleteExperience = async (req, res) => {
    const { id } = req.params; // ID de l'expérience à supprimer
    const userId = req.user.id; // ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification de l'utilisateur
        if (!req.user || !userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        // Validation de l'ID de l'expérience
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'expérience invalide." });
        }
        const experienceId = parseInt(id, 10);

        // --- Vérification de propriété CRITIQUE ---
        const existingExperience = await prisma.experience.findUnique({
            where: { id: experienceId },
            select: { userId: true },
        });

        if (!existingExperience) {
            return res.status(404).json({ message: "Expérience non trouvée." });
        }
        if (existingExperience.userId !== userId) {
            return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez supprimer que vos propres expériences." });
        }

        // Effectuer la suppression
        await prisma.experience.delete({ where: { id: experienceId } });

        return res.status(200).json({
            message: "Expérience supprimée avec succès."
        });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression de l'expérience :", error);
        // Gérer les erreurs spécifiques de Prisma (ex: ID non trouvé)
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Expérience non trouvée pour la suppression." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la suppression de l'expérience.",
            error: error.message
        });
    }
};


module.exports= {getProfil,
     updateProfile,
     updateExperience, 
     updateDiplome,
     addExperience,
     deleteExperience,
     addDiplome,
     deleteDiplome
    }