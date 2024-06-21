import ContactForm from "./ContactForm.js";

class EditContactForm extends ContactForm {
  constructor(insertionCallback, appState) {
    super(insertionCallback, appState);
  }

  async draw(params = {}) {
    const contact = params.id ? await this.appState.findContact(params.id) : null;
    if (contact) {
      super.draw(contact, true);
    } else {
      const navCreateForm = new CustomEvent('appnavigation', { detail: '/' });
      document.dispatchEvent(navCreateForm);
    }
      
  }
}

export default ((insertionCallback, appState) => new EditContactForm(insertionCallback, appState));
