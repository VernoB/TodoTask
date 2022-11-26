/**
 * @module task
 */
const fs = require("fs");
const path = require("path");

const { taskModel, db } = require("../models/task.model");
const User = require("../models/user.model");
const { isError } = require("../middleware/validation.middleware");

/**
 *@public
 *@function addTasks
 *@description takes a form as input contained task and userId, and save the record
 * @param {Object} req Express request with form elements in body of post
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//add tasks (done)
exports.addTasks = async (req, res, next) => {
  //ADD NEW TASK IN THE DATABASE BY DEFAULT COMPLETED = FALSE
  /**
   * @function isError call with req parameter to check if error exist in the input
   */
  isError(req); // check the validation route

  //Check for image existence
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  if (!req.userId) return next(new Error("Not authorized!"));

  const { title, content } = req.body;
  // console.log("title " + title + " content " + content);
  const imageUrl = req.file.path;
  /**
   * @class
   * @description initialize the taskModel with data
   */
  const task = new taskModel({
    title,
    content,
    imageUrl,
    author: req.userId,
  });
  /**
   * @name save
   * @function save()
   * @description save
   */
  // console.log(req);
  return await task
    .save()
    .then((doc) => {
      // console.log(doc);
      if (!doc) return next(new Error("Failed to save."));
      return res.status(201).json({
        message: "Task created successfully \n",
        id: doc._id,
        title,
        description: doc.content,
        image: doc.imageUrl,
      });
    })
    .catch((err) => {
      // console.log(err);
      if (!err.statusCode) err.statusCode = 500;
      return next(new Error("Error in saving process"));
    });
};
/**
 *@public
 *@function listCompleted
 *@description return list of all task mark completed by the database
 * @param {Object} req Express request with form elements in body of post
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//lists all the complete tasks (done+)
exports.listCompleted = async (req, res, next) => {
  /**
   * @name completedList
   * @function find
   * @description find the list of completed task with specified limit
   * @param {req.query.limit, req.query.skip}
   * @return {Object} list of task completed
   */

  const limit = req.query.limit || 10;
  const skip = req.query.skip || 0;

  // console.log(req);
  return await taskModel
    .find({ completed: true }, null, { limit, skip, sort: { _id: 1 } })
    .select(" -updatedAt -__v -createdAt")
    .populate("author", "_id email name")
    .then((tasks) => {
      if (!tasks || tasks.length === 0)
        return next(new Error("No tasks have been done yet !"));
      res.status(200).send({ Lists: tasks });
    })
    .catch((err) => {
      if (err) return next(new Error("Failed to fetch tasks"));
    });
};
/**
 *@public
 *@function getTask
 *@description return a specific task by the id provided
 * @param {Object} req Express request with form elements in body of post and the id in query
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//selected a specific task (done)
exports.getTask = async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new Error("Need to provided id"));

  // console.log(req.userId + " " + id);

  return await taskModel
    .find({ _id: id, author: { $eq: req.userId } })
    .select(" -updatedAt -__v -createdAt")
    .populate("author", "_id email name")
    .then((task) => {
      if (!task || task.length === 0)
        return next(new Error("No task found for this specific user!"));
      res.status(200).json({ task });
    });
};
/**
 *@public
 *@function markAllCompleted
 *@description mark all the task in the database as done, with all_done specify in the body
 * @param {Object} req Express request with form elements in body of post
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//Marks all the task completed (done)
exports.markAllCompleted = async (req, res, next) => {
  if (!req.body.all_done || req.body.all_done !== true) return next();
  // console.log(req);

  // return res.send({ message: "all_done" });
  return await taskModel
    .updateMany(
      { completed: false },
      { $set: { completed: true } },
      { multi: true }
    )
    .then((result) => {
      if (result.modifiedCount === 0)
        return next(new Error("no task mark completed!"));
      console.info("Mark %s task(s) completed. ", result.modifiedCount);
      return res.status(200).json({
        message: "Mark " + result.modifiedCount + " task(s) completed",
      });
    })
    .catch((error) => {
      if (error) error.statusCode = 500;
      return next(error);
    });
};
/**
 *@public
 *@function updatedTask
 *@description Update a task by id
 * @param {Object} req Express request with form elements in body of post
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//updated Tasks (done)
exports.updatedTask = async (req, res, next) => {
  const { taskId } = req.query;
  const { imageUrl } = req.body;

  //validation routes
  isError(req);

  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }

  return await taskModel
    .findByIdAndUpdate(taskId, req.body)
    .where({ authorId: req.userId })
    .select("_id title imageUrl content")
    .populate("author", "_id email name")
    .then((task) => {
      // console.log(task);
      if (!task || task.length === 0)
        return next("no task found for this user");
      //check if the task have the image url
      if (imageUrl !== task.imageUrl) {
        clearImage(task.imageUrl);
      }
      return task;
    })
    // return await taskModel
    //   .findById(taskId)
    //   .then((task) => {
    //     if (!task) {
    //       const error = new Error("Could not find task.");
    //       error.statusCode = 404;
    //       throw error;
    //     }
    //     if (task.author.toString() !== req.userId) {
    //       const error = new Error("Not authorized!");
    //       error.statusCode = 403;
    //       throw error;
    //     }
    //     //check if the task have the image url
    //     if (imageUrl !== task.imageUrl) {
    //       clearImage(task.imageUrl);
    //     }
    //     task.title = title;
    //     task.imageUrl = imageUrl;
    //     task.content = content;
    //     task.author = author;
    //     return task.save();
    //   })
    .then((result) => {
      res.status(200).json({
        message: "Task updated!",
        task: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
/**
 *@public
 *@function del
 *@description returned message 'task deleted' for specific task deleted , if not returned error message
 * @param {Object} req Express request with form elements in body of post
 * @param {Object} res return an object containing data, else error in json format
 * @param {*} next return error to the error handler
 * @returns {Object}
 */
//delete task (done)
exports.del = async (req, res, next) => {
  const { taskId } = req.query;

  isError(req);
  // console.log(req);
  // return res.send({ message: "task deleted" });
  if (!taskId) return next(new Error("taskId required"));

  //check if the user have the right to deleted task
  return await taskModel
    .findById(taskId)
    .then((task) => {
      if (!task || task.length === 0) {
        const error = new Error("task not found !");
        error.statusCode = 403;
        throw error;
      }
      // console.log(task.author);
      // console.log(req.userId);
      if (task.author.toString() !== req.userId) {
        const error = new Error("not authorized to deleted this task!");
        error.statusCode = 404;
        throw error;
      }
      // console.log("imageUrl " + task.imageUrl);
      clearImage(task.imageUrl);
      return taskModel.findByIdAndRemove(taskId);
    })
    .then((count) => {
      if (count === null) return next(new Error("no task deleted"));
      // console.log(count);
      return res.send({ message: "task deleted ", result: count });
    })
    .catch((error) => {
      // console.log(error);
      return next(new Error("failed to deleted !!"));
    });
};

/**
 *@function clearImage
 * @description with the function, you can clear the image in the directory
 * @param {string} filePath (url image)
 * @returns true or false
 */
const clearImage = (filePath) => {
  // filePath = path.join(__dirname, "..", filePath);
  // console.log("filepath " + filePath);
  return fs.unlinkSync(filePath);
};
