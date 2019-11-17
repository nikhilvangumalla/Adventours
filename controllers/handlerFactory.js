const ErrorHandling = require('./../utils/errorHandling');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/APIFeatures');

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // for nested get tour from reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitingFields()
      .paginate();
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      totaldocs: doc.length,
      data: {
        doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // const tour = await Tour.findById(req.params.id).populate('reviews');

    if (!doc) {
      return next(
        new ErrorHandling(`No document with the given ID:${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(
        new ErrorHandling(`No document with the given ID:${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new ErrorHandling(`No document with the given ID:${req.params.id}`, 404)
      );
    }
    res.status(204).json({
      status: 'success'
    });
  });
