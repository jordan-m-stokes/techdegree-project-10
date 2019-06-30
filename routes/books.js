
//npm imports
const Express = require('express');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

//fields
const router = Express.Router();

//models
const Book = require("../models").Book;

//generates an object of html attributes for the table headers in "index.pug"
//this allows sorting functionallity (by title, author, etc...)
function generateTableAttributes(page, search, order)
{
	let attributes = 
	{
		title: {
			class: ""
		},
		author: {
			class: ""
		},
		genre: {
			class: ""
		},
		year: {
			class: ""
		}
	}

	//checks if there is an order value and includes it in the links
	if(order)
	{
		attributes[order].class = "selected";
	}
	//constructs href attribute for each link
	Object.keys(attributes).forEach((column) => 
	{
		attributes[column].href = `/books/page/${page}?${(search) ? (`search=${search}`) : (``)}&order=${column}`
	});
	return attributes;
}

//generates the page links href attributes based on the search and order already given
function generatePageLinks(pages, search, order)
{
	let links = [];

	for(let i = 0; i < pages; i++)
	{
		let href = `/books/page/${i + 1}?`;

		//if there is a search or order value they're included here
		if(search)
		{
			href += `search=${search}`;
		}
		if(order)
		{
			href+= `&order=${order}`;
		}
		links.push(href);
	}
	return links;
}

//main route, immediately redirects to the first page of books
router.get('/', (request, response) => 
{
  	response.redirect('/books/page/1');
});

//GET all books on a page
router.get('/page/:page', (request, response, next) => 
{
	//get params and querys from request
	const search = request.query.search;
	const page   = request.params.page;
	let   order  = request.query.order;

	//if the page number isn't a number throws a 404 error
	if(isNaN(page))
	{
		const error = new Error("This page doesn't exist: ");

        error.status = 404;
            
        next(error);
	}

	//establishes a config for the sql query
	const config = 
	{ 
		order: [["year", "DESC"]],
		limit: 10,
		offset: (page * 10) - 10
	}

	//sets the ordering in the config based on the query in the request
	if(Object.keys(Book.rawAttributes).includes(order) && order != "year")
	{
		config.order = [[order, "ASC"]];
	}
	//sets default order to year if not established or misestablished
	else
	{
		order = "year";
	}

	//if a search is provided the config is updated to search based on the provided query
	if(search)
	{
		config.where =
		{
			[Op.or]: [
				{
					title: {
						[Op.like]: `%${search}%`
					}
				},
				{
					author: {
						[Op.like]: `%${search}%`
					}
				},
				{
					genre: {
						[Op.like]: `%${search}%`
					}
				},
				{
					year: {
						[Op.like]: `%${search}%`
					}
				}
			] 
			
		}
	}

	//A call to count how many items are in the database
	Book.findAll({
		attributes: [[Sequelize.fn('COUNT', Sequelize.col('*')), 'count']],
		where: config.where
	}).then((results) =>
	{
		const pages = Math.ceil(results[0].dataValues.count / 10);

		//checks to see if the current page is higher than the total number of pages and
		//throws an error if so
		if(pages < page)
		{
			const error = new Error("This page doesn't exist: ");

			error.status = 404;
				
			next(error);
		}

		//retrieves books based on the config
		Book.findAll(config).then((books) => 
		{
			//sets local variables for use in index.pug file and renders
			response.locals.books = books;
			response.locals.tableAttributes = generateTableAttributes(page, search, order);
			response.locals.pageLinks = generatePageLinks(pages, search, order);
			response.locals.page = parseInt(page);
			response.locals.search = search;
			response.locals.order = order;

			response.render("index");

		}).catch((error) => 
		{
			error.status = 500;
			next(error);
		});

	}).catch((error) => 
	{
		error.status = 500;
		next(error);
	});

	
});

//GET new book form
router.get('/new', (request, response, next) => 
{
	response.locals.book = Book.build();

	response.render('new');
});

//GET individual book for edit
router.get('/edit/:id', (request, response, next) => 
{
	//searches for book based on id in the params
    Book.findByPk(request.params.id).then((book) =>
    {
		//if book exists it is rendered to the user for edit
		if(book)
		{
			response.locals.book = book;

			response.render('edit');
		}
		//if not a not found error is thrown
		else
		{
			const error = new Error("This page doesn't exist: ");

            error.status = 404;
            
            next(error);
		}
		}).catch(() => 
		{
			error.status = 500;
			next(error);
		});
  });

// POST create book
router.post('/', (request, response, next) =>
{
	//creates book based on request body
    Book.create(request.body).then(() => 
    {
      	response.redirect("/books");

    }).catch((error) => 
    {
		//if an error is thrown because of a missing required value, this is
		//made clear to the user
		if(error.name === "SequelizeValidationError")
		{
			const errors = error.errors;

			response.locals.book = Book.build(request.body);
			response.locals.errors = errors;
			response.locals.errorMessage = `Uh oh, something is missing!`;

			//checks which required values are missing and highlights the absence
			//to the user
			errors.forEach(err => 
			{
				if(err.path === "title")
				{
					response.locals.titleClass = "error";
				}
				else if(err.path === "author")
				{
					response.locals.authorClass = "error";
				}
			});

			response.render("new");
		}
		else
		{
			throw error;
		}

    }).catch(() => 
    {
		error.status = 500;
		next(error);
    });
});

//POST update article
router.post("/:id/update", (request, response, next) =>
{
	//finds book based on id param
    Book.findByPk(request.params.id).then((book) =>
    {
		//calls for update
      	return book.update(request.body);

    }).then(() => 
    {
      	response.redirect("/books");  

    }).catch((error) => 
    {
		//if an error is thrown because of a missing required value, this is
		//made clear to the user
		if(error.name === "SequelizeValidationError")
		{
			const errors = error.errors;

			response.locals.book = Book.build(request.body);
			response.locals.book.id = request.params.id;
			response.locals.errors = errors;
			response.locals.errorMessage = `Uh oh, something is missing!`;

			//checks which required values are missing and highlights the absence
			//to the user
			errors.forEach(err => 
			{
				if(err.path === "title")
				{
					response.locals.titleClass = "error";
				}
				else if(err.path === "author")
				{
					response.locals.authorClass = "error";
				}
			});

			response.render("edit");
		}
		else
		{
			throw error;
		}

    }).catch((error) => 
    {
		error.status = 500;
		next(error);
    });  
  });

/* POST delete article. */
router.post("/:id/delete", (request, response, next) =>
{
	//finds book based on id param
    Book.findByPk(request.params.id).then((book) =>
    {
		//removes book if it exists
		if(book)
		{
			return book.destroy();
		}
		else
		{
			const error = new Error("This page doesn't exist: ");

            error.status = 404;
            
            next(error);
		}
    }).then(() => 
    {
      	response.redirect("/books");

    }).catch((error) => 
    {
		error.status = 500;
		next(error);
    });
  
});

module.exports = router;