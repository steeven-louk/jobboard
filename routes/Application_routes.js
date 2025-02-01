const express = require('express');
const { verifyToken } = require('../middlewares/auth');
const { sumbitApplication } = require('../controllers/applicationController');

const application_Route = express.Router();

application_Route.post('/apply_job/:jobId',verifyToken, sumbitApplication);


module.exports = application_Route;