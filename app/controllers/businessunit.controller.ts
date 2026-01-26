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
  BusinessUnit.create(businessUnit as any)
    .then((data: any) => {
      res.send(data);
    })
    .catch((err: any) => {
      if (err.name === 'SequelizeValidationError') {
        res.status(400).send({
          message: err.message
        })
        return;
      }
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Business Unit.",
      });
    });
};

// Retrieve all BusinessUnits from the database.
exports.findAll = (req: pkg.Request, res: pkg.Response) => {

  BusinessUnit.findAll()
    .then((data: any) => {
      res.send(data);
    })
    .catch((err: any) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving all business units.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req: pkg.Request, res: pkg.Response) => {
  const id = req.params.id;

  BusinessUnit.findByPk(id)
    .then((data: any) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Business Unit with id=${id}.`,
        });
      }
    })
    .catch((err: any) => {
      res.status(500).send({
        message: "Error retrieving Business Unit with id=" + id,
      });
    });
};

// Update a BusinessUnit by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  let businessUnitForId = await BusinessUnit.findByPk(id);
  if (!businessUnitForId) {
    res.status(404).send({ message: `Business Unit for id ${id} not found.` });
    return;
  }
  BusinessUnit.update(req.body, {
    where: { id: id },
  })
    .then((num: [number]) => {
      if (num[0] == 1) {
        res.send({
          message: "Business Unit was updated successfully.",
        });
      } else {
        res.status(400).send({
          message: `Cannot update Business Unit with id=${id}. Please check request body!`,
        });
      }
    })
    .catch((err: any) => {
      if (err.name === 'SequelizeValidationError') {
        res.status(400).send({
          message: err.message
        });
        return;
      }
      res.status(500).send({
        message: "Error updating Business Unit with id=" + id,
      });
    });
};

// Delete a Business Unit with the specified id in the request
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  let businessUnitForId = await BusinessUnit.findByPk(id);
  if (!businessUnitForId) {
    res.status(404).send({ message: `Business Unit for id ${id} not found.` });
    return;
  }

  BusinessUnit.destroy({
    where: { id: id },
  })
    .then((num: number) => {
      if (num == 1) {
        res.send({
          message: "Business Unit was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Business Unit with id=${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err: string) => {
      res.status(500).send({
        message: "Could not delete Business Unit with id=" + id,
      });
    });
};


export default exports;
