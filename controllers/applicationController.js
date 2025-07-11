const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


const getAllApplication = async (req, res) => {
    try {
        // Vérification que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Utilisateur non authentifié. Veuillez vous reconnecter." });
        }

        const userId = req.user.id

        // Vérifier si l'utilisateur existe dans la base de données
        const existingUser = await prisma.user.findUnique({
            where: { id: userId}
        });

        if (!existingUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Récupérer les applications de l'utilisateur
        const applications = await prisma.application.findMany({
            where: { userId: existingUser.id },
            include: {
                job: true,  // Inclure les détails de l'offre d'emploi
                user: {      // Inclure les détails de l'utilisateur
                    select: {
                        fullName: true,
                        email: true,
                        sexe: true,
                        phone: true,
                        city:true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return res.status(200).json({ applications });
    } catch (error) {
        console.error("Erreur lors de la récupération des applications :", error);
        return res.status(500).json({ 
            message: "Erreur interne du serveur lors de la récupération des applications", 
            error: error.message 
        });
    }
};


const getApplication = async (req, res) => {
    try {
      // Vérifier que l'ID est bien fourni et convertible en nombre
      if (!req.params.id || isNaN(Number(req.params.id))) {
        return res.status(400).json({ message: "ID d'application invalide" });
      }
  
      const applicationId = Number(req.params.id);
      const userIdFromToken = req.user.id;
      const userRole = req.user.role;
      const companyIdFromToken = req.user.companyId;

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { 
           job:{
                select:{
                    id: true,
                    title:true
                }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              picture: true,
              phone: true
            }
          },
          coverLetter: true,
          cv_url: true
        }
      });
  
      if (!application) {
        return res.status(404).json({ message: "Candidature non trouvée" });
      }

              // --- Vérification d'autorisation CRITIQUE ---
        // Seul le candidat ou le recruteur propriétaire du job peut voir la candidature.
        const isApplicant = application.user.id === userIdFromToken;
        const isJobOwnerRecruiter = userRole === "RECRUITER" &&
                                    application.job &&
                                    application.job.companyId === companyIdFromToken;

        if (!isApplicant && !isJobOwnerRecruiter) {
            return res.status(403).json({ message: "Accès non autorisé à cette candidature." });
        }
  
      return res.status(200).json({ application });
    } catch (error) {
      console.error("❌ Erreur dans getApplication:", error);
      return res.status(500).json({  
        message: "Erreur interne du serveur lors de la récupération de la candidature.",
        error: error.message});
    }
  };
  
const sumbitApplication = async(req,res)=>{
    const {jobId} = req.params;
    const {coverLetter,cv_url} = req.body
    const userId = req.user.id

    try {
        if (!jobId) {
            return res.status(400).json({ message: "L'identifiant de l'offre d'emploi est requis." });
        }

        // Vérifier si les champs requis sont bien fournis
        if (!coverLetter || !cv_url) {
            return res.status(400).json({ message: "La lettre de motivation et l'URL du CV sont requises." });
        }

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: {id:userId}
        });

        if(!user) {
            return res.status(403).json({message:"Utilisateur non trouvé. Veuillez vous reconnectez pour postuler"});
        }

        const parsedJobId = parseInt(jobId,10);
        // Vérifier si l'utilisateur a déjà postulé
        const existingApplication = await prisma.application.findUnique({
            where: {
                userId_jobId:{jobId:parsedJobId, userId:userId}     
            },
        });

        if (existingApplication) {
            return res.status(200).json({ message: "Vous avez déjà postulé à cette offre." });
        }else{
            const newApplication = await prisma.application.create({
                data:{
                    userId:req.user.id,
                    jobId:parseInt(jobId),
                    coverLetter,
                    cv_url,
                    status: "PENDING",
                    createdAt: new Date()
                }
            });
            return res.status(201).json({
                message: "Votre candidature a été envoyée avec succès.",
                newApplication,
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de la candidature :", error);
        // Gérer les erreurs spécifiques de Prisma si nécessaire (ex: job non trouvé)
        if (error.code === 'P2025') { // Code d'erreur Prisma pour "record not found" (si jobId n'existe pas)
            return res.status(404).json({ message: "L'offre d'emploi spécifiée n'existe pas." });
        }
        return res.status(500).json({
            message: "Erreur interne du serveur lors de l'envoi de la candidature.",
            error: error.message
        });
    }
}

module.exports = { sumbitApplication,getAllApplication, getApplication };