import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//businessUnitId
//userId
const Employee = SequelizeInstance.define("employee", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    semester: {
        type: Sequelize.STRING,
        allowNull: false
    },
    currentlyEmployed:{
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    maxWeeklyHours:{
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 20
    },
    minWeeklyHours:{
        type: Sequelize.INTEGER,
        allowNull: true
    },
    isManager: {
        type:Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

export default Employee;

export type EmployeeType = InstanceType<typeof Employee>;
