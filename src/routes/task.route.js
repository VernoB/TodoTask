const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const isAuth = require("../middleware/isAuth.middleware");

/**
 * Task module
 * @module /
 * @see module:/
 */

/**
 * GET all completed tasks by the user
 * @module /tasks/completed/
 * @return {string} the list of user with completed task
 */

//GET all incomplete tasks (done)
router.get("/tasks/completed", isAuth, taskController.listCompleted);

/**
 * Get a specific task by for a specific user
 * @module /task/id?
 * @return {string} a task for the user
 */
// GET specific tasks
router.get("/task/:id", isAuth, taskController.getTask);

/**
 * Add a task to the database by a specific user
 * @module /task/add/
 *  @param {string} title - provide the task title
 * @param {string} content - provide the task content
 * use for validation
 */
//POST add new task /task (done)
router.post(
  "/task/add",
  isAuth,
  [
    body("title")
      .notEmpty()
      .withMessage("Please provide the task title")
      .isLength({ min: 5 })
      .withMessage("Title with be at least 5 words"),
    body("content").notEmpty().withMessage("Content is empty!"),
  ],
  taskController.addTasks
);

// router.get("/tasks/:taskId", isAuth, taskController.task);
/**
 * Mark all the uncompleted to task to complete
 * @module /tasks/completed/
 * @param {string} all_done - set the value to true to confirm
 * @return {string} tasks - tasks mark completed
 */
//PUT all tasks as completed
router.put("/tasks/completed", isAuth, taskController.markAllCompleted);

/**
 * Update specific user task
 * @module /task/taskId?
 * @param {string} title - task title need to pass validation
 * @param {string} content - task content need to pass validation
 * @return {string} updated task
 */
//updated task
router.put(
  "/task/:taskId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  taskController.updatedTask
);

/**
 * Delete a specific task by user
 * @module /task/taskId?
 */
//DELETE task
router.delete("/task/:taskId", isAuth, taskController.del);

module.exports = router;
