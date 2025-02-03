const express = require('express');
const { verifyToken } = require('../middlewares/auth');
const { sumbitApplication, getAllApplication } = require('../controllers/applicationController');

const application_Route = express.Router();

application_Route.post('/apply_job/:jobId',verifyToken, sumbitApplication);
application_Route.get('/applications',verifyToken, getAllApplication);


module.exports = application_Route;