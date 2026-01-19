import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const allowedRoles = ['user', 'coach', 'admin'];
const User = SequelizeInstance.define("user", {

  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING(25),
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING(25),
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  pushToken: {
    type: Sequelize.STRING(256),
    allowNull: true,
  },
  role: {
    type: Sequelize.ENUM(allowedRoles),
    validate: {
      isIn: {
        args: [allowedRoles],
        msg: "role not allowed. Valid roles are user and admin"
      }
    }
  },
  // refresh_token: {
  //   type: Sequelize.STRING(512),
  //   allowNull: true
  // },
  // expiration_date: {
  //   type: Sequelize.DATE,
  //   allowNull: true
  // },
});

export default User;

