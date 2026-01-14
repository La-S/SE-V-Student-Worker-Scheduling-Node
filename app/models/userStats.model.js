import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const UserStats = SequelizeInstance.define("user_stats", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  weight: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  height: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

export default UserStats;
