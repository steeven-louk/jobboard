const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Récupérer toutes les offres d'emploi
const getJobs = async (_, res) => {

    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            include:{
                    company:{
                        select:{domaine:true,logo:true}
                    },
                    Payment:true
        }
        });
        console.log("jobssss")

        return res.status(200).json({ jobs:jobs });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des offres d'emploi :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des offres d'emploi.",
            error: error.message
        });
    }
};

// Récupérer une offre d'emploi spécifique
const getJob = async (req, res) => {
    const { id } = req.params;
    try {
        // Validation de l'ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'offre d'emploi invalide." });
        }

        const jobId = parseInt(id, 10);

        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { company: true } // Inclure tous les détails de l'entreprise
        });

        if (!job) {
            return res.status(404).json({ message: "Offre d'emploi non trouvée." });
        }
        return res.status(200).json({ jobs:job });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération de l'offre d'emploi :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération de l'offre d'emploi.",
            error: error.message
        });
    }
};

// Ajouter une nouvelle offre d'emploi
const addJob = async (req, res) => {
    const { title, description, location, salary, jobType,duration, isPremium,skill, requirement,expiration_date } = await req.body;
    const userId = await req.user.id;
    
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user || req.user.role !== "RECRUITER") {
            return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs peuvent ajouter des offres d'emploi." });
        }

        if (!title || !description || !location || salary === undefined || !jobType || !duration || !skill || !requirement || !expiration_date) {
            return res.status(400).json({ message: "Tous les champs obligatoires (titre, description, localisation, salaire, type de job, durée, compétences, exigences, date d'expiration) sont requis." });
        }

        // Vérifier si l'utilisateur recruteur a une entreprise associée
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { company: { select: { id: true } } },
        });

        if (!user || !user.company) {
            return res.status(400).json({ message: "Aucune entreprise associée à votre compte recruteur. Veuillez créer ou associer une entreprise." });
        }

        const companyId = user.company.id; // L'ID de l'entreprise du recruteur


        // Création de l'offre d'emploi
        const createJob = await prisma.job.create({
            data: {
                title,
                description,
                skill,
                requirement,
                location,
                salary:parseInt(salary,10),
                duration,
                jobType,
                expiration_date: new Date(expiration_date),
                userId: userId,
                companyId: companyId, // Associer l'offre à l'entreprise du recruteur
            },
        });

        return res.status(201).json({ 
            message: "Offre d'emploi ajoutée avec succès.", createJob });
    }  catch (error) {
        console.error("❌ Erreur lors de l'ajout de l'offre d'emploi :", error);
        // Gérer les erreurs spécifiques de Prisma si nécessaire
        if (error.code === 'P2003') { // Foreign key constraint failed (ex: companyId ou userId n'existe pas)
            return res.status(400).json({ message: "Erreur de données : L'entreprise ou l'utilisateur associé n'existe pas." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de l'ajout de l'offre d'emploi.",
            error: error.message
        });
    }
};

// Modifier une offre d'emploi
const updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, salary, jobType, isPremium } = req.body;
    const userIdFromToken = req.user.id; // ID de l'utilisateur authentifié
    const userRole = req.user.role; // Rôle de l'utilisateur authentifié

    try {
                // Validation de l'ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'offre d'emploi invalide." });
        }
        const jobId = parseInt(id, 10);

        // Récupérer l'offre d'emploi existante pour vérification de propriété
        const existingJob = await prisma.job.findUnique({
            where: { id: jobId },
            select: { userId: true, companyId: true } // Sélectionne l'ID de l'utilisateur qui a créé le job et l'ID de l'entreprise
        });

        if (!existingJob) {
            return res.status(404).json({ message: "Offre d'emploi non trouvée." });
        }

        // --- Vérification d'autorisation CRITIQUE ---
        // Seul l'administrateur OU le recruteur propriétaire du job peut le modifier.
        if (userRole === "RECRUITER") {
            // Pour un recruteur, l'ID de l'utilisateur dans le token doit correspondre à l'ID de l'utilisateur qui a créé le job
            // Et l'ID de l'entreprise du recruteur doit correspondre à l'ID de l'entreprise du job
            if (existingJob.userId !== userIdFromToken || existingJob.companyId !== req.user.companyId) {
                return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez modifier que vos propres offres d'emploi." });
            }
        } else if (userRole !== "ADMIN") {
            // Si ce n'est ni un recruteur propriétaire, ni un administrateur
            return res.status(403).json({ message: "Accès non autorisé : Vous n'avez pas les permissions requises pour modifier cette offre." });
        }

                // Préparer les données pour la mise à jour (permet des mises à jour partielles)
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (location !== undefined) updateData.location = location;
        if (salary !== undefined) updateData.salary = parseInt(salary, 10);
        if (jobType !== undefined) updateData.jobType = jobType;
        if (duration !== undefined) updateData.duration = duration;
        if (isPremium !== undefined) updateData.isPremium = isPremium;
        if (skill !== undefined) updateData.skill = skill;
        if (requirement !== undefined) updateData.requirement = requirement;
        if (expiration_date !== undefined) updateData.expiration_date = new Date(expiration_date);

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: updateData
        });

        return res.status(200).json({ message: "Offre d'emploi modifiée avec succès", updatedJob });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de l'offre d'emploi :", error);
        // Gérer les erreurs spécifiques de Prisma, par exemple si l'ID n'existe pas
        if (error.code === 'P2025') { // Code d'erreur Prisma pour "Record not found"
            return res.status(404).json({ message: "Offre d'emploi non trouvée pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la mise à jour de l'offre d'emploi.",
            error: error.message
        });
    }
};

// Supprimer une offre d'emploi
const deleteJobs = async (req, res) => {
    const { id } = req.params;
    const userIdFromToken = req.user.id; // ID de l'utilisateur authentifié
    const userRole = req.user.role; // Rôle de l'utilisateur authentifié

    try {
        // Validation de l'ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'offre d'emploi invalide." });
        }
        const jobId = parseInt(id, 10);

        // Récupérer l'offre d'emploi existante pour vérification de propriété
        const existingJob = await prisma.job.findUnique({
            where: { id: jobId },
            select: { userId: true, companyId: true } // Sélectionne l'ID de l'utilisateur qui a créé le job et l'ID de l'entreprise
        });

        if (!existingJob) {
            return res.status(404).json({ message: "Offre d'emploi non trouvée." });
        }

        // --- Vérification d'autorisation CRITIQUE ---
        // Seul l'administrateur OU le recruteur propriétaire du job peut le supprimer.
        if (userRole === "RECRUITER") {
            // Pour un recruteur, l'ID de l'utilisateur dans le token doit correspondre à l'ID de l'utilisateur qui a créé le job
            // Et l'ID de l'entreprise du recruteur doit correspondre à l'ID de l'entreprise du job
            if (existingJob.userId !== userIdFromToken || existingJob.companyId !== req.user.companyId) {
                return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez supprimer que vos propres offres d'emploi." });
            }
        } else if (userRole !== "ADMIN") {
            // Si ce n'est ni un recruteur propriétaire, ni un administrateur
            return res.status(403).json({ message: "Accès non autorisé : Vous n'avez pas les permissions requises pour supprimer cette offre." });
        }

        // Effectuer la suppression
        const job = await prisma.job.delete({
            where: { id: jobId }
        });
        return res.status(200).json({ 
            message: "Le job a été supprimé avec succès", 
            job 
        });
    }  catch (error) {
        console.error("❌ Erreur lors de la suppression de l'offre d'emploi :", error);
        // Gérer les erreurs spécifiques de Prisma, par exemple si l'ID n'existe pas
        if (error.code === 'P2025') { // Code d'erreur Prisma pour "Record not found"
            return res.status(404).json({ message: "Offre d'emploi non trouvée pour la suppression." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la suppression de l'offre d'emploi.",
            error: error.message
        });
    }
};

// Ajouter ou retirer un job des favoris
const addToFavorie = async (req, res) => {
    const { jobId } = req.params; // L'ID du job à ajouter/retirer des favoris
    const userId = req.user.id; // L'ID de l'utilisateur authentifié

    try {
        // Validation de l'ID du job
        if (!jobId || isNaN(Number(jobId))) {
            return res.status(400).json({ message: "ID d'offre d'emploi invalide." });
        }
        const jobIdInt = parseInt(jobId, 10);

        // Vérifier si l'offre d'emploi existe
        const jobExists = await prisma.job.findUnique({
            where: { id: jobIdInt }
        });
        if (!jobExists) {
            return res.status(404).json({ message: "Offre d'emploi non trouvée." });
        }

        // Vérifier si l'offre est déjà en favoris pour cet utilisateur
        const existingFavorite = await prisma.favoris.findUnique({
            where: {
                userId_jobId: { // Utilise la contrainte unique composite
                    jobId: jobIdInt,
                    userId: userId
                }
            }
        });

        if (existingFavorite) {
            // Si l'offre est déjà en favoris, la supprimer
            await prisma.favoris.delete({
                where: { id: existingFavorite.id } // Supprime par l'ID unique du favori
            });
            return res.status(200).json({
                message: "Offre supprimée des favoris avec succès.",
                isFavorite: false // Indique que l'offre n'est plus en favoris
            });
        } else{
            await prisma.favoris.create({
                data: {
                    userId: userId,
                    jobId: jobIdInt,
                }
            });
            return res.status(201).json({
                message: "Offre ajoutée aux favoris avec succès.",
                isFavorite: true // Indique que l'offre est maintenant en favoris
            });
        }


    } catch (error) {
        console.error("❌ Erreur lors de l'ajout/suppression des favoris :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la gestion des favoris.",
            error: error.message
        });
    }
};

// Récupérer les offres d'emploi favorites de l'utilisateur
const getFavoris = async (req, res) => {
    const userId = req.user.id; // L'ID de l'utilisateur authentifié

    try {
        // Vérification de l'authentification (redondant si verifyToken est utilisé, mais bonne double vérification)
        if (!req.user) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }
        const favoris = await prisma.favoris.findMany({
            where: { userId: userId},
            include: { job: true },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return res.status(200).json({ favoris });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des favoris :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des favoris.",
            error: error.message
        });
    }
};


const isInFavorite = async (req, res) => {
    const { jobId } = await req.query;
    const userId = await req.user.id;
  
    try {
                // Validation de l'ID du job
        if (!jobId || isNaN(Number(jobId))) {
            return res.status(400).json({ message: "ID d'offre d'emploi invalide." });
        }
        const parsedJobId = parseInt(jobId, 10);

      const existingFavorite = await prisma.favoris.findFirst({
        where: { 
            userId:String(userId), 
            jobId: parsedJobId
        },
      });
  
      return res.status(200).json({
            message: "Vérification du statut de favori effectuée.",
            isFavorite: !!existingFavorite // Convertit en booléen
        });
    } catch (error) {
        console.error("❌ Erreur lors de la vérification du statut de favori :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la vérification du statut de favori.",
            error: error.message
        });
    }
  };

module.exports = { getJobs, getJob, addJob, updateJob, deleteJobs, addToFavorie, getFavoris,isInFavorite };
