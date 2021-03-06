const router = require('express').Router();
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

router.get('/signup', viewController.getSignupForm);

router.get(
  '/',

  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get(
  '/my-tours',
  bookingController.createBookingCheckout,
  authController.protect,
  viewController.getMyTours
);
router.get('/my-reviews', authController.protect, viewController.getMyReviews);

module.exports = router;
