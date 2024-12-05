const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const cors = require("cors");
app.use(cors());

const passport = require("passport");
const { title } = require("process");
require("./passport");

const Movies = Models.Movie;
const Users = Models.User;

//s3 access requirements
const fileupload = require("express-fileupload");
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: "eu-central-1",
  endpoint: "http://s3.amazonaws.com/",
  forcePathStyle: false
});

app.use(fileupload());

app.get('/s3check', async (req, res) => {
  try {
      // Check connection to S3 bucket by listing objects
      const listObjectsParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          MaxKeys: 1 // Limit the number of objects returned to 1 for a quick check
      };
      await s3Client.send(new ListObjectsV2Command(listObjectsParams));
      res.send('You have reached the backend server and are connected to the S3 bucket.');
  } catch (error) {
      console.error('Error connecting to S3 bucket:', error.message);
      res.status(500).send('You reached the server, but no connecting to S3 bucket.');
  }
});

app.get('/files/list', (req, res) => {
  const listObjectsParams = {
      Bucket: process.env.S3_BUCKET_NAME
  };
  s3Client.send(new ListObjectsV2Command(listObjectsParams))
      .then((listObjectsResponse) => {
          res.send(listObjectsResponse);
      })
      .catch((error) => {
          console.log(error);
          res.status(500).send({ error: error.message });
      });
});

app.post('/files/upload', async (req, res) => {
  console.log(req.files)
  if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;
  const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.name,
      Body: file.data
  };

  try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      res.send('File uploaded successfully.');
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});

/**
 * @file provides api endpoints for a movie database
 * @author Otmar Kirchgäßner
 */

//connecting to db hosted at atlas

mongoose.connect("mongodb://10.1.1.100:27017/mySciFiApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: process.env.DB_USER,
  pass: process.env.DB_USER_PASS,
  authSource: "admin",
  tls: false,
  family: 4
});

app.use(bodyParser.json());
let auth = require("./auth")(app);
// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});
//setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/", (req, res) => {
  res.send("Welcome to my Sci-Fi page!");
});


/**
 * Return all movies of the db as json file
 * @param {string} path - /movies
 * @param {string} authentication - jwt
 * @function app.get
 * @returns {JSON} - all movies from the db
 */
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Return a single movie in a JSON file
 * @param {string} path - /movies/:title
 * @param {string} authentication - jwt
 * @function app.get
 * @returns {JSON} - a single movie from the db
 */
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        if (movie) {
          console.log(movie);
          res.status(200).json(movie);
        } else {
          res.status(404).send("404: Movie could not be found");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Return genre of a movie
 * @param {string} path - /movies/genre/:title
 * @param {string} authentication - jwt
 * @function app.get
 * @returns {JSON} - genre of a movie
 */
app.get(
  "/movies/genre/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        console.log(movie);
        if (movie) {
          genre = movie.genre;
          res.status(200).json(genre);
        } else {
          res.status(404).send("404: Movie could not be found.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Return data about director
 * @param {string} path - /movies/director/:title
 * @param {string} authentication - jwt
 * @function app.get
 * @returns {JSON} - director of a movie
 */
app.get(
  "/movies/director/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        if (movie) {
          director = movie.director;
          res.status(200).json(director);
        } else {
          res.status(404).send("404: Movie could not be found.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Register new user in db
 * @param {string} path - /users/register/
 * @param {string} authentication - none
 * @param {string} body - Username, name, email, Password, Birthday
 * @function app.post
 * @returns {JSON} - new user's data
 */
app.post(
  "/users/register/",
  [
    check(
      "Username",
      "Username is required, including at least five characters"
    ).isLength({ min: 5 }),
    check("name", "name is required with at least 5 characters.").isLength({
      min: 5,
    }),
    check("email", "valid email is requires").isEmail(),
    check(
      "Password",
      "Password must include at least 8 characters."
    ).isLength({ min: 8 }),
    check(
      "Birthday",
      "Birthday can either be not defined or in the format of DDMMYYY"
    )
      .optional()
      .matches(/^\d{2}\d{2}\d{4}$/),
  ],
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const newUser = req.body;
    let hashedPassword = Users.hashPassword(newUser.Password);
    await Users.findOne({ Username: newUser.Username })
      .then((user) => {
        if (user) {
           res
              .status(400)
              .send("User " + newUser.Username + " already exists.");
          console.log("User already exists.");
        } else {
          Users.create({
            name: newUser.name,
            Username: newUser.Username,
            email: newUser.email,
            Password: hashedPassword,
            Birthday: newUser.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Update user's password
 * @param {string} path - /users/newpassword
 * @param {string} authentication - jwt
 * @param {string} body - Password
 * @function app.put
 * @returns {string} - message "Password updated."
 */
app.put("/users/newpassword",[check(
  "Password",
  "Password is required with at least 8 characters."
).isLength({ min: 8 })],
passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    console.log(hashedPassword)
    await Users.findOneAndUpdate({Username:req.user.Username},{$set: {Password:hashedPassword}})
    .then(res.send("Password updated."))
    .catch((error)=>{res.send("not updated" + error)})
  }
)

/**
 * Update user's password
 * @param {string} path - /users/newusername
 * @param {string} authentication - jwt
 * @param {string} body - oldUserName, newUserName
 * @function app.put
 * @returns {JSON} - updated user's data
  */
app.put(
  "/users/newusername",
  [
    check("oldUserName", "oldUserName is required").not().isEmpty(),
    check(
      "newUserName",
      "newUserName is required, including at least five characters"
    ).isLength({ min: 5 }),
    check(
      "newUserName",
      "newUserName may only include letters and numbers."
    ).isAlphanumeric(),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const oldUsername = req.body.oldUserName;
    const newUsername = req.body.newUserName;
    if (req.user.Username !== oldUsername) {
      return res.status(400).send("Permission denied");
    }

    await Users.findOneAndUpdate(
      { Username: oldUsername },
      {
        $set: { Username: newUsername },
      },
      { new: true }
    )
      .then((user) => {
        res.status(200).json(user);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Update user's data: username, name, email and birthday
 * @param {string} path - /users/newdetails
 * @param {string} authentication - jwt
 * @param {string} body - username, name, email, birthday
 * @function app.put
 * @returns {JSON} - updated user's data
 */
app.put(
  "/users/newdetails",
  [
    check("Username", "Username is required, including at least five characters").optional().isLength({min:5}),
    check("name", "name is required with at least 5 characters.")
      .optional()
      .isLength({ min: 5 }),
    check("email", "valid email is requires").optional().isEmail(),
    check(
      "Birthday",
      "Birthday can either be not defined or in the format of DDMMYYY"
    )
      .optional()
      .matches(/^\d{2}\d{2}\d{4}$/),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (!req.body.Username && !req.body.name && !req.body.email && !req.body.Birthday) {
      res.status(400).send("no valid data sent");
    } else {
      if (req.body.name) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { name: req.body.name } }
        );
      }

      if (req.body.email) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { email: req.body.email } }
        );
      }

      if (req.body.Birthday) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { Birthday: req.body.Birthday } }
        );
      }

      if (req.body.Username) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { Username: req.body.Username } }
        );
      }

      if (!req.body.Username) {
      Users.findOne({ Username: req.user.Username }).then((user) => {
        res.json(user);
      })}else{
        Users.findOne({ Username: req.body.Username })
        .then((user) => {
          res.json(user)
        });
      }
    }
  }
);

/**
 * Deregestering user from db
 * @param {string} path - /users/delete
 * @param {string} authentication - jwt
 * @param {string} body - Username
 * @function app.delete
 * @returns {string} - message "User deleted."
 */

app.delete(
  "/users/delete",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const userToDelete = req.body.Username;
    if (req.user.Username !== userToDelete) {
      return res.status(400).send("Permission denied");
    }
    Users.findOneAndDelete({ Username: userToDelete }, { new: true })
      .then((user) => {
        res.status(200).send("User " + user.Username + " deleted.");
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//add favorite movie
/**
 * Add favorite movie to user's favorite movies
 * @param {string} path - /users/favoritemovie
 * @param {string} authentication - jwt
 * @param {string} body - favoriteMovie
 * @function app.post
 * @returns {JSON} - updated user's data
 */
app.post(
  "/users/favoritemovie/",
  [check("favoriteMovie", "favoriteMovie must match movie title").isLength({ min: 1 })],
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    console.log(req.body);
    const titleMovie = req.body.favoriteMovie;

    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        if (movie) {
          Users.findOneAndUpdate(
            { Username: req.user.Username },
            { $addToSet: { favoriteMovies: movie._id } }
          )
          .then(() =>
            Users.findOne({ Username: req.user.Username })
          )
          .then((user) => {
            res
              .status(200)
              .json(user);
          }).catch((error) => {res.status(500).send("Error: " + error);})
        } else {
          res.status(400).send("400: Movie not registered.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Delete movie from user's favorite movies
 * @param {string} path - /users/favoritemovie
 * @param {string} authentication - jwt
 * @param {string} body - favoriteMovie
 * @function app.delete
 * @returns {JSON} - updated user's data
 */
app.delete(
  "/users/favoritemovie/",
  [check("favoriteMovie", "favoriteMovie may only include letters").isLength({ min: 1 })],
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const titleMovie = req.body.favoriteMovie;

    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        if (movie) {
          Users.findOneAndUpdate(
            { Username: req.user.Username },
            { $pull: { favoriteMovies: movie._id } }
          )
          .then(() =>
            Users.findOne({ Username: req.user.Username })
          )
          .then((user) => {
            res
              .status(200)
              .json(user);
          }).catch((error) => {res.status(500).send("Error: " + error);})
        } else {
          res.status(400).send("400: Movie not registered.");
        }


      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

app.use(express.static("public"));

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("App is up and running on " + port);
});