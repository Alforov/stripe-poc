document.addEventListener('DOMContentLoaded', async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const {publishableKey} = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please check `.env` and try again'
    );
    alert('Please set your Stripe publishable API key in the .env file');
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  const url = new URL(window.location);
  const clientSecret = url.searchParams.get('setup_intent_client_secret');

  const {error, setupIntent} = await stripe.retrieveSetupIntent(
    clientSecret
  );
  if (error) {
    addMessage(error.message);
  }
  addMessage(`Setup ${setupIntent.status}: ${setupIntent.id}`);
  //backend
  const params = {
    setup_intent:  url.searchParams.get('setup_intent')
  };
  const {
    confirm
  } = await fetch('/validate-stipe-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).then(r => r.json());

  addMessage(`Confirmed ${confirm}`);
});
