import ContactForm from "../classes/ContactForm.js";

class EditContactForm extends ContactForm {
  constructor(insertionCallback, appState) {
    super(insertionCallback, appState);
  }

  async draw(params = {}) {
    const contact = params.id ? await this.appState.findContact(params.id) : null;
    if (contact) {
      const formatted = this.appState.formatContacts([contact])[0];
      // contact.tags = contact.tags.join(', ')
      super.draw(formatted, true);
    } else {
      const navCreateForm = new CustomEvent('appnavigation', { detail: '/' });
      document.dispatchEvent(navCreateForm);
    }
  }
}

export default ((insertionCallback, appState) => new EditContactForm(insertionCallback, appState));
