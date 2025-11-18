// // services/paymentService.js
// import Stripe from 'stripe';

// // Replace with your Stripe secret key (test or live)
// const stripe = Stripe('your_stripe_secret_key');

// export const createPaymentIntent = async (amountInRupees) => {
//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amountInRupees * 100, // convert INR to paise
//       currency: 'inr',
//     });
//     return paymentIntent.client_secret;
//   } catch (error) {
//     console.error('Error creating payment intent:', error);
//     throw new Error('Payment initiation failed');
//   }
// };
