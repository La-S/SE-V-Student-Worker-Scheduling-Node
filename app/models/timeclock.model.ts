import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//shiftId,
const Timeclock = SequelizeInstance.define("timeclock", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    clockIn: {
        type: Sequelize.TIME
    },
    clockOut: {
        type: Sequelize.TIME
    }
})


export default Timeclock

export type TimeclockType = InstanceType<typeof Timeclock>;