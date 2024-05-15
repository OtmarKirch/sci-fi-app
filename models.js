const mongoose = require("mongoose");
const bcrypt = require("bcrypt")

let movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: {
    name: String,
    description: String,
  },
  director: {
    name: String,
    description: String,
  },
  birthyear: {type: Date},
  deathyear: {type: Date},
  ranking: {type: Number, min: 1, max: 10}
});

let userSchema = mongoose.Schema({
  name: { type: String, required: true },
  Username: { type: String, required: true },
  email: { type: String, required: true },
  Password: { type: String, required: true },
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  Birthday: Date,
});

userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10)
}

userSchema.methods.validatePassword = function(password){
  return bcrypt.compareSync(password, this.Password)
}

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
