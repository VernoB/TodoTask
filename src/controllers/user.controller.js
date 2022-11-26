/**
 * @module users
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const isAuth = require("../middleware/isAuth.middleware");
const User = require("../models/user.model");
const { isError } = require("../middleware/validation.middleware");
require("dotenv").config();

/**
 * @public
 * @function init
 * @name POST /auth/signup
 * @description takes a form as in input and try to create new user in database,
 *  If failed returned an error
 * @param {object} req Express request with form element in the body of post
 * @param {object} res return the users create in json format
 * @param {object} next if error send to the error handler method
 * @returns {undefined}
 */
//Create new user
exports.createUser = (req, res, next) => {
  //check error in the validation fields
  // console.log(req);
  isError(req);
  // load data in the request
  const { email, password, name } = req.body;

  /**
   * @name bcrypt
   * @function bcrypt
   * @descript generate the password haswed to stored in the database
   * @throws {Error} if error occured
   */
  //crypt the password and save to the database
  bcrypt
    .hash(password, 12)
    .then((hashedPsw) => {
      const user = new User({
        email,
        name,
        password: hashedPsw,
      });
      return user.save();
    })
    .then((result) => {
      if (!result) return next(new Error("Cannot create user"));
      res.status(201).json({ message: "User created!", userId: result._id });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res
          .status(400)
          .json({
            message: "Email already exists in the database",
            // value: err.keyValue,
          })
          .send();
      } else {
        const err = new Error();
        err.statusCode = 500;
        err.message = "Existing error while saving";
        next(err);
      }
    });
};

/**
 * @public
 * @function login
 * @name POST /auth/login
 * @description takes a form as input and looks for associated user record. If successfully,
 * set cookie withn user info and send user token
 * @param {object} req Express request with form element in the body of post
 * @param {object} res return the users create in json format
 * @param {object} next if error send to the error handler method
 * @returns {undefined}
 */
//logged the user
exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;

  /**
   * @name findUser
   * @function findOne
   * @description find specific user with the same email in the database
   * @returns {Object} with the generate token and userId
   * @throws {error} if no user founded with that email
   */
  // console.log("password" + password);
  User.findOne({ where: { email } })
    .then((user) => {
      // console.log(user);
      if (!user) {
        const error = new Error("Invalid email");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, loadedUser.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Invalid email or password");
        error.statusCode = 422;
        throw error;
      }

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );

      return res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      if (!err) {
        err.statusCode = 500;
      }
      // console.log(err);
      return next(err);
    });
};

/**
 *@public
 *@function usersAll
 *@description return all the users in the database
 * @param {*} req express containt the data form
 * @param {Object} res send the response with the users
 * @param {*} next throw an error if not found
 * @returns {Object}
 */
//lists all te user
exports.usersAll = async (req, res, next) => {
  /**
   * @name findUsers
   * @function find
   * @description find users existing in the database
   * @returns {Object} object containing the lists of users presents
   * @throws {error} if no user founded
   */
  return await User.find(
    {},
    { password: 0, createdAt: 0, updatedAt: 0, __v: 0 }
  )
    .then((users) => {
      if (!users) next("Empty users in the database");
      return res.status(200).json({ ListUser: users }).send();
    })
    .catch((err) => {
      if (err) {
        err.statusCode = 500;
      }
      return next(err);
    });
};

/**
 *@public
 *@function getById
 *@description get user by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

exports.getById = (req, res, next) => {
  /**
   * @name getUserById
   * @param {id}
   * @function findById
   * @description get user in the database with the specified id
   * @returns _id name and email of the user
   * @throws {err} if exist in the transaction
   */
  const { id } = req.query;

  User.findById(id, "_id email name")
    .then((user) => {
      if (!user) return next(new Error("user not found").statusCode(404));
      return res.status(200).json({ User: user });
    })
    .catch((err) => {
      if (err) return next(new Error("Fetched failed!"));
    });
};

/**
 * @public
 * @function logout
 * @name get /auth/logout
 * @description clear a httponly cookie from the client by setting it to empty string and returns the unauthenticated index page
 */
exports.logout = (req, res, next) => {
  req.userId = null;
  return isAuth();
};
