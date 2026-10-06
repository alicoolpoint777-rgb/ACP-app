const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

// @desc  List the signed-in technician's personal tasks
// @route GET /api/tasks?done=
// @access Private (technician)
const listTasks = asyncHandler(async (req, res) => {
  const filter = { technician: req.user._id };
  if (req.query.done !== undefined) {
    filter.done = req.query.done === 'true';
  }

  const tasks = await Task.find(filter).sort({ done: 1, dueDate: 1, createdAt: -1 });
  res.json({ success: true, count: tasks.length, tasks });
});

// @desc  Add a personal task
// @route POST /api/tasks
// @access Private (technician)
const createTask = asyncHandler(async (req, res) => {
  const { title, notes = '', dueDate, priority = 'normal' } = req.body;
  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error('title is required');
  }
  if (!['low', 'normal', 'high'].includes(priority)) {
    res.status(400);
    throw new Error('priority must be low, normal or high');
  }

  const task = await Task.create({
    technician: req.user._id,
    title: String(title).trim(),
    notes,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    priority,
  });

  res.status(201).json({ success: true, task });
});

// @desc  Update a personal task (title, notes, done, due date, priority)
// @route PATCH /api/tasks/:id
// @access Private (technician)
const updateTask = asyncHandler(async (req, res) => {
  const allowed = ['title', 'notes', 'done', 'dueDate', 'priority'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, technician: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, task });
});

// @desc  Delete a personal task
// @route DELETE /api/tasks/:id
// @access Private (technician)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    technician: req.user._id,
  });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, message: 'Task removed' });
});

module.exports = { listTasks, createTask, updateTask, deleteTask };
