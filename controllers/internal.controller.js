const { Task } = require("../models");
const { Op } = require("sequelize");

const getOverdueTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: {
        deadline: { [Op.lt]: new Date() },
        status: { [Op.ne]: "done" },
        alertSent: false,
      },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const markAlertSent = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    task.alertSent = true;
    await task.save();
    res.json({ message: "alertSent updated" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverdueTasks, markAlertSent };
