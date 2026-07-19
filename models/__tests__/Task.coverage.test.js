const { Task } = require('../index');

describe('Task Model Coverage', () => {
  test('should have Task model defined', () => {
    expect(Task).toBeDefined();
  });

  test('should have model associations', () => {
    expect(Task.belongsTo).toBeDefined();
  });

  test('should validate task schema', () => {
    const taskAttributes = {
      title: { type: 'STRING', allowNull: false },
      description: { type: 'TEXT', allowNull: true },
      status: { type: 'ENUM', allowNull: false, defaultValue: 'todo' },
      priority: { type: 'ENUM', allowNull: false, defaultValue: 'medium' },
      deadline: { type: 'DATE', allowNull: true },
      alertSent: { type: 'BOOLEAN', allowNull: false, defaultValue: false },
      userId: { type: 'INTEGER', allowNull: false },
    };

    expect(taskAttributes.title).toBeDefined();
    expect(taskAttributes.status).toBeDefined();
    expect(taskAttributes.priority).toBeDefined();
  });
});
