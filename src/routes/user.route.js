const express = require("express");
const { query, body } = require("express-validator");

const router = express.Router();
const userController = require("../controllers/user.controller");
const isAuth = require("../middleware/isAuth.middleware");

/**
 *
 * User routes modules
 * @module /auth
 *
 * @see module:/auth/
 */

//list all the users in the database
/**
 * List all the users in the database
 * @module /auth/users/
 */
router.get("/users", userController.usersAll);

//logged routes
/**
 * Logged to generated a token
 * @module /auth/login/
 * need three params for validation
 * @param {string} email - provide the user email
 * @param {string} password - provide the user password
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
    body(
      "password",
      "Enter a valid email with numbers and text and at least 8 characters."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
  ],
  userController.login
);

/**
 * Signup routes , use to create new user
 * @module /auth/register
 * receives three params
 * @param {string} email - provide the user email
 * @param {string} name - provide the user name
 * @param {string} password - provide the user password
 */
//signup routes
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
    body("name").notEmpty().withMessage("Enter a name"),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 8 characters."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
  ],
  userController.createUser
);

/**
 * Fetched specific user by id
 * @module /auth/id?
 * receive the id in the query
 */
//get specific user by id
router.get("/:id", isAuth, userController.getById);

/**
 * Logout the user to the app
 * @module /auth/logout/
 */
//logout to the app
router.get("/logout", userController.logout);
// router.all("*", (req, res) =>
//   res.status(404).send({ error: "url not available!" })
// );

module.exports = router;
