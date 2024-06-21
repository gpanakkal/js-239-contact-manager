import ContactForm from "./ContactForm.js";

class CreateContactForm extends ContactForm {
  constructor(insertionCallback, appState) {
    super(insertionCallback, appState);
  }

  draw() {
    super.draw(null, false);
  }
}

export default ((insertionCallback, appState) => new CreateContactForm(insertionCallback, appState));
