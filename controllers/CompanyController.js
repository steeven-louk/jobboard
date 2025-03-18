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
        domaine:true
      }
    });

    return res.status(200).json({companies});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des offres.",error:error });
  }
};

const getCompanyDetail = async (req, res) => {
  const {id} = await req.params;
  // console.log(role)
  try {

   
    const company = await prisma.company.findUnique({
      where :{ id:parseInt(id)},
      include:{jobs:true}
    });

    if(!company){
      return res.status(404).json({message:"company introuvable"});
    }

    return res.status(200).json({company});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des offres.",error:error });
  }
};

const updateCompany = async (req, res) => {
  const { name, description,location,website,domaine,logo,employeeCount} = await req.body;
  const {id} = await req.params;
  const companyId = await req.user.companyId;
  const userId = await req.user.id

  try {
    if(companyId !== parseInt(id)){
      return res.status(403).json({message:"company introuvable"});
    }
  
    // Vérifier si l'utilisateur est un recruteur
    const user = await prisma.user.findUnique({
      where: { id: userId, role:"RECRUITER" },
      include: { company: true },
    });
   
    const company_exist = await prisma.company.findUnique({
      where :{ id:parseInt(id)}, // include:{jobs:true}
    });

    if (!user || user.role !== "RECRUITER") {
      return res.status(403).json({ message: "Seuls les recruteurs peuvent mettre à jours une company." });
    }

    if(!company_exist){
      return res.status(404).json({message:"company introuvable"});
    }

    const company = await prisma.company.update({
      where:{id:company_exist.id},
      data:{
        name,
        description,
        location,
        website,
        domaine,
        logo,
        employeeCount,
        userId:user.id
      }
    })

    return res.status(200).json({message:"company mise à jour avec succes",company});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des offres.",error:error });
  }
};

const getCompanyJobs = async (req, res) => {
    const companyId = await req.user.companyId;
    // console.log("rre", req.user.companyId)
    try {
      const userId = await req.user.id; // ID du recruteur connecté
  
      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userId, role:"RECRUITER" },
        include: { company: true },
      });

      const company = await prisma.company.findUnique({
        where: {id:companyId }
      });
  
      if (!user || user.role !== "RECRUITER") {
        return res.status(403).json({ message: "Seuls les recruteurs peuvent voir leurs offres." });
      }
      if (!company) {
        return res.status(404).json({ message: "Company introuvable" });
      }
  
      // Récupérer les offres publiées par ce recruteur
      const jobs = await prisma.job.findMany({
        where: { companyId:companyId }
        // include: {
        //   applications: true, // Inclure les candidatures reçues pour chaque offre
        //   company:true
        // },
      });
  
      return res.status(200).json({jobs});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des offres." });
    }
  };

  const getApplyJobs = async (req, res) => {
    // const {companyId} = await req.params;
    const companyId = await req.user.companyId;

    try {
      const userId = await req.user.id; // ID du recruteur connecté
  
      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userId, role:"RECRUITER" },
        include: { company: true },
      });

      const company = await prisma.company.findUnique({
        where: {id: companyId}
      });
  
      if (!user || user.role !== "RECRUITER") {
        return res.status(403).json({ message: "Seuls les recruteurs peuvent voir leurs offres." });
      }
      if (!company) {
        return res.status(404).json({ message: "Company introuvable" });
      }
  
      // Récupérer les offres publiées par ce recruteur
      const applyJobs = await prisma.job.findMany({
        where: { companyId:companyId },
        select:{id:true,title:true,applications:{
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
            }
        }},
      });
  
      return res.status(200).json({applyJobs});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des offres." });
    }
  };

  const updateApplicationStatus = async (req, res) => {
    const {applicationId} = await req.params;
    const {status} = await req.body;
    const companyId = await req.user.companyId;

    try {
      const userId = await req.user.id; // ID du recruteur connecté
  
      // Vérifier si l'utilisateur est un recruteur
      const user = await prisma.user.findUnique({
        where: { id: userId, role:"RECRUITER" },
        include: { company: true },
      });

      const company = await prisma.company.findUnique({
        where: {id: companyId}
      });
      const application = await prisma.application.findUnique({
        where: {id: parseInt(applicationId)}
      });
  
      if (!user || user.role !== "RECRUITER") {
        return res.status(403).json({ message: "Seuls les recruteurs peuvent voir leurs offres." });
      }
      if (!company) {
        return res.status(404).json({ message: "Company introuvable" });
      }
      if (!application) {
        return res.status(404).json({ message: "application introuvable" });
      }
  
      // Récupérer les offres publiées par ce recruteur
      const applicationStatus = await prisma.application.update({
        where: { id:application.id },
        data:{ status },
        select:{status:true}
      });
  
      return res.status(200).json({applicationStatus});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur lors de la modification du status." });
    }
  };
  
  
  module.exports = { getCompanyJobs, getApplyJobs, updateApplicationStatus, getCompanies, getCompanyDetail, updateCompany };
  