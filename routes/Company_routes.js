const express = require("express");
const { getCompanyJobs, getApplyJobs,updateApplicationStatus } = require("../controllers/CompanyController");
const { verifyToken, verifyRole } = require('../middlewares/auth');

const company_router = express.Router();

// router.get("/my-jobs", authenticateUser, getRecruiterJobs); // Voir ses offres publiées
company_router.get("/company-job", verifyToken,verifyRole(['ADMIN','RECRUITER']), getCompanyJobs); // Voir les jobs
company_router.get("/company-applyJob", verifyToken,verifyRole(['ADMIN','RECRUITER']), getApplyJobs); // Voir les candidatures
company_router.put("/company-jobStatus/:applicationId", verifyToken,verifyRole(['ADMIN','RECRUITER']), updateApplicationStatus); // Voir les candidatures

module.exports = company_router;
