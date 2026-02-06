import db from "../models/index.ts";
const BusinessUnit = db.BusinessUnit;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { BusinessUnitType } from "../types/businessunit.type.ts";
import { AppError } from '../error/app.error.ts';
import { NotFoundError } from "../error/notfound.error.ts";

const exports: any = {};
const errorClassName = "Business Unit";

// Create and Save a new BusinessUnit
exports.create = async (req: pkg.Request, res: pkg.Response) => {

  const businessUnit: BusinessUnitType = {
    id: undefined,
    name: req.body.name,
  };

  // Save User in the database
  const data = await BusinessUnit.create(businessUnit as any)
  res.send(data);
};

// Retrieve all BusinessUnits from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {
  const data = await BusinessUnit.findAll();
  res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  const data = await BusinessUnit.findByPk(id);
  if (!data) {
    throw new NotFoundError(errorClassName, id);
  }
  res.send(data);
};

// Update a BusinessUnit by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  //throws error if not found
  await getBusinessUnitForId(id);

  req.body.id = undefined;
  const numUpdated = await BusinessUnit.update(req.body, {
    where: { id: id },
  });
  if (numUpdated[0] <= 0) {
    throw new AppError(400, `Update for id ${id} did not update. Check request body.`);
  }
  let updatedBusinessUnit = await getBusinessUnitForId(id);
  res.send(updatedBusinessUnit);
};

// Delete a Business Unit with the specified id in the request
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  //throws error if not found
  await getBusinessUnitForId(id);

  const numDeleted = await BusinessUnit.destroy({
    where: { id: id },
  })
  if (numDeleted <= 0) {
    throw new AppError(400, `Delete for id ${id} did not delete. Check request body.`);
  }
  res.status(200).send({ message: "Business Unit deleted successfully!" });
};

async function getBusinessUnitForId(id: number): Promise<Model<any, any>> {
  const data = await BusinessUnit.findByPk(id);
  if (!data) {
    throw new NotFoundError(errorClassName, id);
  }
  return data;
}
export default exports;
