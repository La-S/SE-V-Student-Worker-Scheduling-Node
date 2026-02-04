import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { EmployeeType } from "../types/employee.type.ts";

const exports: any = {};

// Create and Save a new Employee
exports.create = async (req: pkg.Request, res: pkg.Response) => {

  const employee: EmployeeType = {
    id: req.body.id,
    userId: req.body.userId,
    businessUnitId: req.body.businessUnitId,
    semester: req.body.semester,
    currentlyEmployed: req.body.currentlyEmployed ?? true,
    maxWeeklyHours: req.body.maxWeeklyHours ?? 20,
    minWeeklyHours: req.body.minWeeklyHours ?? 0,
    isManager: false
  };

  // Save User in the database
  try {
    const data = await Employee.create(employee as any)
    res.send(data);
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Business Unit.",
    });
  }
};

// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

  try {
    const data = await Employee.findAll()
    res.send(data);
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred while getting all Business Units.",
    });
  }
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
  const id = req.params.id;

  try {
    const data = await Employee.findByPk(id);
    if (!data) {
      res.status(404).send({
        message: `Business Unit for id ${id} not found`
      })
      return;
    }
    res.send(data);
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }
};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    //throws error if not found
    await getEmployeeForId(id, res);
    if (res.headersSent){
      return;
    }

    const numUpdated = await Employee.update(req.body, {
      where: { id: id },
    });
    if (numUpdated[0] <= 0) {
      res.status(400).send({ message: `Update for id ${id} did not update. Check request body.` })
      return;
    }
    let updatedEmployee = await Employee.findByPk(id);
    res.send(updatedEmployee)
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }
};

// Delete a Business Unit with the specified id in the request
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    //throws error if not found
    await getEmployeeForId(id, res);
    if (res.headersSent){
      return;
    }

    const numDeleted = await Employee.destroy({
      where: { id: id },
    })
    if (numDeleted <= 0) {
      res.status(400).send({ message: `Delete for id ${id} did not delete. Check request body.` })
      return;
    }
    res.status(200).send({ message: "Business Unit deleted successfully!" });
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }

};

async function getEmployeeForId(id: number, res: pkg.Response): Promise<Model<any, any> | null>{
  try {
    const data = await Employee.findByPk(id);
    if (!data) {
      res.status(404).send({
        message: `Business Unit for id ${id} not found`
      })
    }
    return data;
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }
  return null;
}

export default exports;
