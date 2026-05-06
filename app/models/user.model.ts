import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

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
  phone: {
    type: Sequelize.STRING,
    allowNull: true
  },
  pushToken: {
    type: Sequelize.STRING(256),
    allowNull: true,
  },
  ocId: {
    type: Sequelize.STRING(50),
    allowNull: true,
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  isStudent: {
    type: Sequelize.BOOLEAN
  },
  
});

export default User;

export type UserType = InstanceType<typeof User>;
