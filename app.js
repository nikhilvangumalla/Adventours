const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

//MIDDLEWARE
const ErrorHandling = require('./utils/errorHandling');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

// security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// app.use((req, res, next) => {
//   console.log(req.headers);
// });

// LIMITING THE REQUESTS TO 50 FOR 15 MIN USING EXPRESS-RATE-LIMIT PACKAGE
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'you have reached the limit from this IP please try again'
});
app.use('/api', limiter);

// body parser reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against nosql query injection ex {$gt:''} in email field on login route
app.use(mongoSanitize());

// static files
// app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin,X-Requested-with,Content-Type,Accept,Authorization'
//   );
//   if (req.method === 'OPTIONS') {
//     res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,PATCH');
//   }
//   next();
// });

// for cors headers
app.use(cors({ credentials: true, origin: true }));
app.options('*', cors());

// test middleware
// app.use((req, res, next) => {
//   // console.log(req.headers);
//   console.log('from app.js', req.cookies);
//   if (req.cookies) {
//     app.locals.jwt = req.cookies.jwt;
//   }
//   next();
// });

app.get('/robots.txt', function(req, res) {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

//ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // NORMAL METHOD

  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} in the server`
  // });

  // WITH ERROR OBJ

  // const err = new Error(`can't find ${req.originalUrl} in the server`);
  // err.statusCode = 404;
  // err.status = 'fail';
  // next(err);

  // WITH THE DEFINED ErrorHandling CLASS UNDER UTILS
  next(new ErrorHandling(`can't find ${req.originalUrl} in the server`, 404));
});

// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// });

// SAME AS ABOVE BUT THE FUNCTION IS DEFINED IN ANOTHER FILE
app.use(globalErrorHandler);

module.exports = app;
