const express = require('express');
const { verifyToken, verifyRole } = require('../middlewares/auth');
const { sumbitApplication, getAllApplication, getApplication } = require('../controllers/applicationController');

const application_Route = express.Router();

application_Route.post('/apply_job/:jobId',verifyToken, sumbitApplication);
application_Route.get('/applications',verifyToken, getAllApplication);
application_Route.get('/application/:id',verifyToken,verifyRole(['ADMIN','RECRUITER']), getApplication);


module.exports = application_Route;