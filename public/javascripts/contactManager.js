import { selectAll } from "./lib/helpers";

class ContactManager {
  static registerPartials() {
    selectAll('script[type="text/x-handlebars"]')
      .filter((script) => script.dataset.type === 'partial')
      .forEach((partial) => {
        Handlebars.registerPartial(script.id, script.innerHTML)
        partial.remove()
      });
  }

  constructor(container) {
    this.container = container;
    this.registerPartials();
    this.state = {
      contacts: null,
    }
    this.routes = {

    }
  }

  
  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }


}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ContactManager(select('#app-container'));
  history.scrollRestoration = "auto";  
});
