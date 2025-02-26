const express = require('express');
const { verifyToken, verifyRole } = require('../middlewares/auth');
const { getJobs, addJob, updateJob, deleteJobs, getJob, addToFavorie, getFavoris, isInFavorite } = require('../controllers/JobsController');

const job_Route = express.Router();

job_Route.get('/jobs', getJobs);
job_Route.get('/job/:id', getJob);
job_Route.post('/create_job',verifyToken,verifyRole(['ADMIN','RECRUITER']), addJob);
job_Route.put('/update_job/:id',verifyToken,verifyRole(['ADMIN','RECRUITER']), updateJob);
job_Route.delete('/delete_job/:id',verifyToken,verifyRole(['ADMIN','RECRUITER']), deleteJobs);

job_Route.post('/job/add_favorie/:jobId',verifyToken, addToFavorie);
job_Route.get('/user/favories',verifyToken,getFavoris);
job_Route.get('/user/favories/check',verifyToken,isInFavorite);


module.exports = job_Route;
