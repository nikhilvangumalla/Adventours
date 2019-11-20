const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const ErrorHandling = require('./../utils/errorHandling');
const Email = require('./../utils/email');

// function to create a token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // console.log('token', token);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // this below code is not working so created a cookie in login.js file
  // res.cookie('jwt', token, cookieOptions);
  res.cookie('jwt', `${token}`);
  // console.log(res.cookie('jwt', token, cookieOptions));

  user.password = undefined; //removing password field from the response output
  // console.log(res);

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // creating a new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // creating a token
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   user: newUser
  // });
  // REPLACING ABOVE CODE WITH A Function
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(req.body);

  // checking input if any fields are missing return error
  if (!email || !password) {
    return next(new ErrorHandling('Provide both email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  // verifying the password using instance created in userModel
  if (!user) {
    return next(new ErrorHandling('Invalid email id', 404));
  }
  const checkPassword = await user.checkPassword(password, user.password);

  // checking if the DB contains email and verifying the password
  if (!user || !checkPassword) {
    return next(new ErrorHandling('invalid password', 401));
  }

  // creating a token
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  // res.cookie('jwt', 'loggedout', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true
  // });
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // checking for token in the request headers
  // console.log(res);
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    // console.log(token);
  }
  // console.log('token from protect', token);

  if (!token) {
    return next(new ErrorHandling('You are not logged in please log in', 401));
  }

  //verification of jwt token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // console.log(decoded);
  // check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ErrorHandling('the user no longer exists! please sign up', 401)
    );
  }

  // if password changed after issuing the jwt token ask to login again
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new ErrorHandling('Password has been changed! please login again', 401)
    );
  }
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // checking for token in the cookies
  if (req.cookies.jwt) {
    const token = req.cookies.jwt;

    //verification of jwt token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // console.log(decoded);
    // check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }

    // if password changed after issuing the jwt token ask to login again
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      return next();
    }
    res.locals.user = currentUser;
    return next();
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandling('You are not authorised to access this route', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  // console.log('error in forgor password');

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandling('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorHandling(
        'There was an error sending the email. Try again later!'
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // hash the token to compare the hashed token in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpries: { $gt: Date.now() }
  });
  if (!user) {
    return next(new ErrorHandling('the token is invalid or expried'), 400);
  }

  // updating the passwords and removing the reset token and expiration date
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpries = undefined;
  user.passwordChangedAt = Date.now() - 1000;

  await user.save();

  createSendToken(user, 201, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // getting user for collection

  const user = await User.findById(req.user.id).select('+password');
  // console.log(req.body);

  // check if user posted current password is correct
  if (!user.checkPassword(req.body.currentPassword, user.password)) {
    return next(new ErrorHandling('your current password is not valid'), 401);
  }
  // if so, update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // log user in and send JWT
  createSendToken(user, 200, res);
});
