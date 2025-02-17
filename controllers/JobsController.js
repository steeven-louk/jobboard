const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Récupérer toutes les offres d'emploi
const getJobs = async (_, res) => {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ jobs:jobs });
    } catch (error) {
        console.error("Erreur lors de la récupération des jobs :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer une offre d'emploi spécifique
const getJob = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            include: { user: true }
        });

        if (!job) {
            return res.status(404).json({ message: "Job non trouvé" });
        }
        return res.status(200).json({ jobs:job });
    } catch (error) {
        console.error("Erreur lors de la récupération du job :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// Ajouter une nouvelle offre d'emploi
const addJob = async (req, res) => {
    const { title, description, location, salary, jobType,duration, isPremium,skill, requirement,expiration_date } = req.body;

    try {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({ message: "Vous n'êtes pas authentifié" });
        }

        // Vérifier si l'utilisateur est un recruteur
        const isRecruter = await prisma.user.findUnique({
            where: { id: req.user.id, role: "RECRUITER" }
        });

        if (!isRecruter) {
            return res.status(403).json({ message: "Accès refusé : vous n'êtes pas recruteur" });
        }

        // Création de l'offre d'emploi
        const createJob = await prisma.job.create({
            data: {
                title,
                description,
                location,
                salary,
                jobType,
                isPremium,
                skill,
                requirement,
                duration,
                expiration_date: "2025-08-15T00:00:00.000Z",
                userId: req.user.id
            }
        });

        return res.status(201).json({ message: "Annonce créée avec succès", createJob });
    } catch (error) {
        console.error("Erreur lors de la création du job :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// Modifier une offre d'emploi
const updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, salary, jobType, isPremium } = req.body;

    try {
        const updatedJob = await prisma.job.update({
            where: { id: parseInt(id) },
            data: { title, description, location, salary, jobType, isPremium }
        });

        return res.status(200).json({ message: "Annonce modifiée avec succès", updatedJob });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du job :", error);
        return res.status(409).json({ error: "Impossible de modifier cette annonce" });
    }
};

// Supprimer une offre d'emploi
const deleteJobs = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({ message: "Le job a été supprimé avec succès", job });
    } catch (error) {
        console.error("Erreur lors de la suppression du job :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// Ajouter ou retirer un job des favoris
const addToFavorie = async (req, res) => {
    const { jobId } = req.params;

    if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
        const jobIdInt = parseInt(jobId);

        // Vérifier si l'offre est déjà en favoris
        const isExist = await prisma.favoris.findUnique({
            where: {
                userId_jobId: {
                    jobId: jobIdInt,
                    userId: req.user.id
                }
            }
        });

        if (isExist) {
            await prisma.favoris.delete({
                where: {
                    userId_jobId: {
                        jobId: jobIdInt,
                        userId: req.user.id
                    }
                }
            });
            return res.status(200).json({ message: "Offre supprimée des favoris" });
        }

        await prisma.favoris.create({
            data: {
                userId: req.user.id,
                jobId: jobIdInt,
            }
        });

        return res.status(201).json({ message: "Offre ajoutée aux favoris" });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer les offres d'emploi favorites de l'utilisateur
const getFavoris = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
        const favoris = await prisma.favoris.findMany({
            where: { userId: req.user.id },
            include: { job: true },
        });

        return res.status(200).json({ favoris });
    } catch (error) {
        console.error("Erreur lors de la récupération des favoris :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = { getJobs, getJob, addJob, updateJob, deleteJobs, addToFavorie, getFavoris };
