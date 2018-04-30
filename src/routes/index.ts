import * as express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/',(req,res,next) => {
  res.send({ok: true, message: 'Welcome to MMIS Planning Management!', version: process.env.VERSION});
});

export default router;