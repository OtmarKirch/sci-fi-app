# sci-fi-app server

<!-- toc -->

- [Description](#description)
- [Technologies](#technologies)
- [Setup](#setup)
  * [Hosted at Heroku](#hosted-at-heroku)
  * [Local Setup](#local-setup)
    + [Database at MongoDB Atlas](#database-at-mongodb-atlas)
    + [Codebase](#codebase)
- [Key Features](#key-features)
- [Impressions](#impressions)
  * [Testing with Postman](#testing-with-postman)
  * [Database at Atlas](#database-at-atlas)
  * [Hosting on Heroku](#hosting-on-heroku)
- [Conclusion](#conclusion)
  * [Challenges](#challenges)
  * [Future Improvements](#future-improvements)
  * [Final Thoughts](#final-thoughts)

<!-- tocstop -->

## Description

This project is part of a full-stack web application using the MERN (MongoDB, Express, React, and Node.js) stack demonstrating comprehensive skills in full-stack JavaScript development.

The server side code for this project is implemented in this repository. The server provides a RESTful API that allows users to access movie data and user data. The server provides endpoints for users to access movie data and user data. For data protection, the password is hashed and the server uses JWT tokens for user authentication. The server is hosted on Heroku and the database is hosted on MongoDB Atlas.

The client side code for this project is implemented in two other repositories: as a [React app](https://github.com/OtmarKirch/MySciFi-client) and as an [Angular app](https://github.com/OtmarKirch/mySciFi-Angular-client). You can find the React app running on [netlifly](https://myscifiapp.netlify.app/) and the Angular app on [GitHub Pages](https://otmarkirch.github.io/mySciFi-Angular-client/).

## Technologies
- Node.js
- Express
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)

## Setup
### Hosted at Heroku

The server is running on Heroku. The root endpoint can be accessed at
https://quiet-bastion-19832-9b36523e0b42.herokuapp.com/

The full API documentation on how to access all public endpoints via API's can be accessed at  
https://quiet-bastion-19832-9b36523e0b42.herokuapp.com/documentation.html

### Local Setup

#### Database at MongoDB Atlas
In order to run the server, a database has to be established at MongoDB Atlas. The connection string can be obtained from the MongoDB Atlas dashboard and has to be stored in an `.env` file ([see below](#codebase)).
The database has to be populated with movie data. This has to be formatted as JSON and can be imported via the MongoDB Atlas dashboard. Movies have to follow the schema as defined in [`models.js`](https://github.com/OtmarKirch/sci-fi-app/blob/main/models.js#L4) in the codebase.

#### Codebase
The server can be run locally by cloning the repository onto your local machine. Make sure to have Node.js and npm installed. Run `npm install` in the root directory of the project to install all dependencies. 
In order to connect to the database, the connection string obtained from Atlas has to be stored in an `.env` file in the root directory of the project. The `.env` file should look like this:

````
DB_CONNECTION_URI="YOUR_CONNECTION"
````
Replace `YOUR_CONNECTION` with the connection string obtained from MongoDB Atlas.

In order to run the server execute the following command in the root directory of the project:

````
node index.js
````

## Key Features
The server provides the following endpoints:
- Return a list of ALL movies to the user
- Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
- Return data about a genre (description) by name/title (e.g., “Thriller”)
- Return data about a director (bio, birth year, death year) by name
- Allow new users to register
- Allow users to update their user info (username, password, email, date of birth)
- Allow users to add a movie to their list of favorites
- Allow users to remove a movie from their list of favorites
- Allow existing users to deregister

For data protection, the password is hashed and
the server uses JWT tokens for user authentication. The server is hosted on Heroku and the database is hosted on MongoDB Atlas.

## Impressions
### Testing with Postman
Requests were tested thouroughly with Postman.

![Postman](./img/scifiappPostman.png)

### Database at Atlas
The database is hosted on MongoDB Atlas.

![Database](./img/scifiappAtlas.png)

### Hosting on Heroku
The server is hosted on Heroku.

![Heroku](./img/scifiappHeroku.png)

## Conclusion

### Challenges
Especially challenging, I found the implementation of the user authentication with the hasehd password and the handling of the JWT tokens. It is complicated to keep track of the tokens and to ensure that they are valid. The syntax is rather complex. It took me a while to get the authentication working properly. But in the end, when it worked, I was able to concentrate completely on the implementation of the endpoints, the heart piece of the server.

### Future Improvements
In a future version, I would like to implement a more stringent naming of the endpoint. As I was learning how to implement the endpoints, I was also learning different ways how data is passed to the server side via the url and the body of the request. A more systematic naming of the endpoints and more systematic request requirements would make the server more robust, easier to maintain and easier to use for developers of the client. 

### Final Thoughts
Providing a server for the client is at the heart of full-stack development. It is the backbone of the application. It was a great experience to implement the server andto see how the client can interact with it implemented in later projects (see [React client](https://github.com/OtmarKirch/MySciFi-client) and [Angular client](https://github.com/OtmarKirch/myFlix-Angular-client)). I learned a lot about the MERN stack and how to implement a server with Node.js and Express.




