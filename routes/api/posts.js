const express = require('express');
const router = express.Router();
//GET api/posts/test
/* 
test posts route
PUBLIC access
*/
router.get('/test' , (req, res) => res.json({msg: "Posts Works"}));

module.exports = router;