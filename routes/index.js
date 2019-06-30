
//npm imports
const Express = require('express');

//fields
const router = Express.Router();

//index route handler
router.get('/', (request, response) => 
{
  response.redirect('/books/page/1');
});

module.exports = router;