const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getCompanies = async (_, res) => {

  try {
    const companies = await prisma.company.findMany({
      select:{
        id:true,
        name:true,
        logo:true,
        location:true,
        domaine:true,
        employeeCount:true
      }
    });

    return res.status(200).json({companies});
  } catch (error) {
        console.error("❌ Erreur lors de la récupération des entreprises :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des entreprises.",
            error: error.message
        });
    }
};

const getCompanyDetail = async (req, res) => {
  const {id} = await req.params;

  try {
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "ID d'entreprise invalide." });
        }

        const companyId = parseInt(id, 10)
   
    const company = await prisma.company.findUnique({
      where :{ id: companyId},
        select:{
          jobs:true,
          logo: true 
      }
    });

    if(!company){
      return res.status(404).json({message:"Entreprise introuvable."});
    }
    return res.status(200).json({company});
  } catch (error) {
        console.error("❌ Erreur lors de la récupération des détails de l'entreprise :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des détails de l'entreprise.",
            error: error.message
        });
    }
};

const updateCompany = async (req, res) => {
  const { name, description,location,website,domaine,logo,employeeCount} = await req.body;
  const {id} = await req.params;
  const companyIdFromToken = req.user.companyId; // ID de l'entreprise associée au recruteur authentifié
  const userIdFromToken = req.user.id

  try {
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "ID d'entreprise invalide." });
    }

      const companyToUpdateId = parseInt(id, 10);
  
    // Vérifier si l'utilisateur est un recruteur
        const user = await prisma.user.findUnique({
            where: { id: userIdFromToken },
            select: { role: true, company: { select: { id: true } } },
        });

        if (!user || user.role !== "RECRUITER") {
            return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs peuvent modifier les informations d'une entreprise." });
        }

        //Vérifier si l'entreprise que le recruteur tente de modifier est bien la sienne
        if (companyToUpdateId !== companyIdFromToken) {
            return res.status(403).json({ message: "Accès non autorisé : Vous ne pouvez modifier que votre propre entreprise." });
        }
   
    //Vérifier si l'entreprise existe réellement
        const existingCompany = await prisma.company.findUnique({
            where: { id: companyToUpdateId },
        });

        if (!existingCompany) {
            return res.status(404).json({ message: "Entreprise introuvable." });
        }

    const company = await prisma.company.update({
      where:{id: companyToUpdateId},
      data:{
        name: name || existingCompany.name, // Utilise la nouvelle valeur ou l'ancienne si non fournie
        description: description || existingCompany.description,
        location: location || existingCompany.location,
        website: website !== undefined ? website : existingCompany.website, // Permet de définir website à null si explicitement envoyé
        domaine: domaine || existingCompany.domaine,
        logo: logo !== undefined ? logo : existingCompany.logo, // Permet de définir logo à null si explicitement envoyé
        employeeCount: employeeCount !== undefined ? employeeCount : existingCompany.employeeCount,
        // userId:user.id
      }
    })

    return res.status(200).json({message:"Entreprise mise à jour avec succes",company});
  } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de l'entreprise :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la mise à jour de l'entreprise.",
            error: error.message
        });
    }
};

const getCompanyJobs = async (req, res) => {
    const companyIdFromToken = req.user.companyId; // ID de l'entreprise du recruteur authentifié
    const userIdFromToken = req.user.id;
    
    try {
  
      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userIdFromToken },
        select: { role: true, company: { select: { id: true } } },
      });

        if (!user || user.role !== "RECRUITER") {
            return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs peuvent voir leurs offres d'emploi." });
        }

        //Vérifier si l'ID de l'entreprise est bien présent dans le token (il devrait l'être pour un recruteur)
        if (!companyIdFromToken) {
             return res.status(401).json({ message: "Informations d'entreprise manquantes pour le recruteur authentifié." });
        }

        //Vérifier si l'entreprise existe réellement (double vérification)
        const company = await prisma.company.findUnique({
            where: { id: companyIdFromToken }
        });

        if (!company) {
            return res.status(404).json({ message: "Entreprise introuvable pour le recruteur authentifié." });
        }
  
      // Récupérer les offres publiées par ce recruteur
      const jobs = await prisma.job.findMany({
        where: { companyId: companyIdFromToken },
        include: {
          company:true
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
  
      return res.status(200).json({jobs});
    }  catch (error) {
        console.error("❌ Erreur lors de la récupération des offres d'emploi de l'entreprise :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des offres d'emploi de l'entreprise.",
            error: error.message
        });
    }
  };

  const getApplyJobs = async (req, res) => {
    const companyIdFromToken = req.user.companyId; // ID de l'entreprise du recruteur authentifié
    const userIdFromToken = req.user.id; // ID de l'utilisateur authentifié

    try {
  
      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userIdFromToken},
        select: { role: true, company: { select: { id: true } } },
      });

        if (!user || user.role !== "RECRUITER") {
            return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs peuvent voir les candidatures." });
        }

        // Vérifier si l'ID de l'entreprise est bien présent dans le token
        if (!companyIdFromToken) {
             return res.status(401).json({ message: "Informations d'entreprise manquantes pour le recruteur authentifié." });
        }

        //Vérifier si l'entreprise existe réellement
        const company = await prisma.company.findUnique({
            where: { id: companyIdFromToken }
        });

        if (!company) {
            return res.status(404).json({ message: "Entreprise introuvable pour le recruteur authentifié." });
        }
  
      // Récupérer les offres publiées par ce recruteur
      const applyJobs = await prisma.job.findMany({
        where: { companyId: companyIdFromToken },
        select:{
          id:true,
          title:true,
          applications:{
            select:{

                id:true,
                status:true,
                cv_url:true,
                coverLetter:true,
                createdAt:true,
                user:{
                    select:{
                        id:true,
                        fullName:true,
                        email:true,
                        phone:true,
                        picture:true
                    }
                }
            },
            orderBy: {
              createdAt: 'desc'
            }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
      });
  
      return res.status(200).json({applyJobs});
    }  catch (error) {
        console.error("❌ Erreur lors de la récupération des candidatures de l'entreprise :", error);
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des candidatures de l'entreprise.",
            error: error.message
        });
    }
  };

  const updateApplicationStatus = async (req, res) => {
    const { applicationId } = req.params;
    const { status: newStatus } = req.body;
    const companyIdFromToken = req.user.companyId;
    const userIdFromToken = req.user.id;

    try {
        // --- Validation des entrées ---
        if (!applicationId || isNaN(Number(applicationId))) {
            return res.status(400).json({ message: "ID de candidature invalide." });
        }
        if (!newStatus || typeof newStatus !== 'string') { // Vérifie que le statut est une chaîne
            return res.status(400).json({ message: "Nouveau statut invalide ou manquant." });
        }

        const parsedApplicationId = parseInt(applicationId, 10);

      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userIdFromToken},
        select: { role: true },
      });

      if (!user || user.role !== "RECRUITER") {
        return res.status(403).json({ message: "Accès non autorisé : Seuls les recruteurs peuvent modifier le statut des candidatures." });
      }

        //Récupérer la candidature et le job associé pour vérifier la propriété de l'entreprise
        const application = await prisma.application.findUnique({
            where: { id: parsedApplicationId },
            include: {
                job: {
                    select: {
                        companyId: true, // ID de l'entreprise propriétaire du job
                    }
                }
            }
        });

        if (!application) {
            return res.status(404).json({ message: "Candidature introuvable." });
        }

        //Vérifier si le recruteur authentifié est bien le propriétaire de l'entreprise qui a publié le job
        if (!application.job || application.job.companyId !== companyIdFromToken) {
            return res.status(403).json({ message: "Accès non autorisé : Cette candidature n'appartient pas à votre entreprise." });
        }
  
      // Récupérer les offres publiées par ce recruteur
      const applicationStatus = await prisma.application.update({
        where: { id: parsedApplicationId},
        data:{ status: newStatus },
        select:{status:true}
      });
  
      return res.status(200).json({applicationStatus});
    }catch (error) {
        console.error("❌ Erreur lors de la mise à jour du statut de la candidature :", error);
        // Gérer les erreurs spécifiques de Prisma si nécessaire (ex: ID non trouvé)
        if (error.code === 'P2025') { // Record not found (si l'application n'existe pas)
            return res.status(404).json({ message: "Candidature non trouvée pour la mise à jour." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de la mise à jour du statut de la candidature.",
            error: error.message
        });
    }
  };
  
  
  module.exports = { getCompanyJobs, getApplyJobs, updateApplicationStatus, getCompanies, getCompanyDetail, updateCompany };
  