import db from "../models/index.js";
const BusinessUnit = db.BusinessUnit;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { BusinessUnitType } from "../types/businessunit.type.js";

const exports: any = {};

// Create and Save a new BusinessUnit
exports.create = async (req: pkg.Request, res: pkg.Response) => {

  const businessUnit: BusinessUnitType = {
    id: req.body.id,
    name: req.body.name,
  };

  // Save User in the database
  try {
    const data = await BusinessUnit.create(businessUnit as any)
    res.send(data);
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Business Unit.",
    });
  }
};

// Retrieve all BusinessUnits from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

  try {
    const data = await BusinessUnit.findAll()
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
    const data = await BusinessUnit.findByPk(id);
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

// Update a BusinessUnit by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    //throws error if not found
    getBusinessUnitForId(id, res);
    if (res.headersSent){
      return;
    }

    const numUpdated = await BusinessUnit.update(req.body, {
      where: { id: id },
    });
    if (numUpdated[0] <= 0) {
      res.status(400).send({ message: `Update for id ${id} did not update. Check request body.` })
      return;
    }
    let updatedBusinessUnit = await BusinessUnit.findByPk(id);
    res.send(updatedBusinessUnit)
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
    getBusinessUnitForId(id, res);
    if (res.headersSent){
      return;
    }

    const numDeleted = await BusinessUnit.destroy({
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

async function getBusinessUnitForId(id: number, res: pkg.Response): Promise<Model<any, any> | null>{
  try {
    const data = await BusinessUnit.findByPk(id);
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
