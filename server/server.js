const express = require('express');
const app = express();
const { resolve } = require('path');
// Replace if using a different env file or config
const env = require('dotenv').config({ path: './.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/accept-a-payment/payment-element",
    version: "0.0.2",
    url: "https://github.com/stripe-samples"
  }
});

console.log(process.env.STATIC_DIR)
console.log('process.env.STATIC_DIR')
app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/config', (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});


app.get('/create-setup-intent', async (req, res) => {
  let setupIntent;

  try {
    const customer = await stripe.customers.create({
      name: 'Jenny Rosen',
      email: 'jennyrosen@example.com',
    });


    setupIntent =  await stripe.setupIntents.create({
      payment_method_types: ['card'],
      customer: customer.id
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: setupIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.post('/confirm-setup-intent', async (req, res) => {
  const { setup_intent } = req.body;
  try {
    const confirmIntent = await stripe.setupIntents.retrieve(
      setup_intent
    );
    res.send({
      clientSecret: confirmIntent.client_secret,
      confirm: confirmIntent.status
    });
    console.log(JSON.stringify(confirmIntent));
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
