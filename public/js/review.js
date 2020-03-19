import axios from 'axios';
import { showAlert } from './alerts';

export const review = async (reviewtext, rating, tourId, userId) => {
  try {
    const res = await axios({
      method: 'post',
      url: '/api/v1/reviews',
      data: {
        review: reviewtext,
        rating,
        tour: tourId,
        user: userId
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Review created Successfully');
      location.assign('/my-reviews');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    console.log(err.response);
  }
};
