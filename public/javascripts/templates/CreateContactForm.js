import ContactForm from '../classes/ContactForm.js';

class CreateContactForm extends ContactForm {
  draw() {
    super.draw(null, false);
  }
}

export default (
  (insertionCallback, appState) => new CreateContactForm(insertionCallback, appState)
);
