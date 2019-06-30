
//npm imports
const Express    = require('express');
const BodyParser = require('body-parser');

//route middle-ware
const IndexRoute = require('./routes');
const BooksRoute  = require('./routes/books');

//networking code
const app = Express();
{
    //sets "view engine" to work with .pug template files
    app.set('view engine', 'pug');

    //middle-ware
    {
        //third-party middle-ware installation
        app.use(BodyParser.urlencoded(
        {
            extended: false
        }));
        
        //route middle-ware installation
        app.use('/', IndexRoute);
        app.use('/books', BooksRoute);
        app.use('/static', Express.static('public'));

        //handler for errors
        app.use((request, response, next) =>
        {
            //creates error to throw for missing page
            const error = new Error("This page doesn't exist: ");

            error.status = 404;

            next(error);
        });
        //renderer for errors
        app.use((error, request, response, next) => 
        {
            //gives error data to the "about.pug" file
            response.locals.error = error;

            //stores error status in response so the client won't have a "200" status
            response.status(error.status || 500);
        
            if(error.status == 404)
            {
                //renders "error.pug" in views folder
                response.render('not-found');
            }
            else
            {
                console.log(error);
                response.render('server-error');
            }
        });
    }

    //runs server on "port: 3000"
    app.listen(3000, () =>
    {
        console.log('server running - port: 3000');
    });
}