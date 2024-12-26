init = async (name, email) => {
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
  const params = {
    lastName:  name,
    email: email
  }
  const {
    error: backendError,
    clientSecret
  } = await fetch('/create-stripe-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).then(r => r.json());



  if (backendError) {
    addMessage(backendError.message);
  }
  addMessage(`Client secret returned.`);
  const loader = 'auto'
  const elements = stripe.elements({ clientSecret, loader });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
  /*const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");*/
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;
    const nameInput = document.querySelector('#name');

 /*   const {error: stripeError} = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/return.html`,
      }
    });*/

    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required'
    });
    console.log(JSON.stringify(result));
    localStorage.setItem('intentId', result.setupIntent.id);
    // intentId should be passed as an additional field of ViaxIndividual
    closePopup();


    if (stripeError) {
      addMessage(stripeError.message);

      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }
  });
}
const form = document.getElementById('userForm');
const popup = document.getElementById('popup');
const overlay = document.getElementById('overlay');
const submitButton = document.getElementById('submitButton');
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  await init(name, email);

  popup.style.display = 'block';
  overlay.style.display = 'block';
});

function closePopup() {
  popup.style.display = 'none';
  overlay.style.display = 'none';
}

function toggleSubmitButton() {
  const yesRadio = document.getElementById('yesRadio');
  if (yesRadio.checked) {
    submitButton.style.display = 'inline-block'; // Show submit button if "Yes" is selected
  } else {
    submitButton.style.display = 'none'; // Hide submit button if "No" is selected
  }
}
