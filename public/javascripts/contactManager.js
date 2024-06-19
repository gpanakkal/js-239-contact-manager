import AppState from "./classes/AppState.js";
import Router from "./classes/Router.js";
import { select, selectAll, xhrRequest } from "./lib/helpers.js";
import ContactForm from "./templates/ContactForm.js";
import Home from "./templates/Home.js";

class ContactManager {
  static registerPartials() {
    selectAll('script[type="text/x-handlebars"]')
      .filter((script) => script.dataset.type === 'partial')
      .forEach((partial) => {
        Handlebars.registerPartial(partial.id, partial.innerHTML)
        partial.remove()
      });
  }

  constructor(container) {
    this.container = container;
    this.insertionCallback = (html) => this.container.insertAdjacentHTML('beforeend', html);
    ContactManager.registerPartials();
    this.state = new AppState();
    // define routes and arrays of template wrapper functions
    this.routes = {
      '/': this.pages(Home),
      '#home': this.pages(Home),
      '#contacts/new': this.pages(ContactForm),
      '#contacts/edit/:id': this.pages(ContactForm),
      '#contacts/delete/:id': this.pages(), // remove this - should be a contact API request only
    }
    this.router = new Router(this);
  }

  pages(...templateWrappers) {
    return templateWrappers.map((wrapper) => wrapper(this.insertionCallback, this.state));
  }

  // custom element - home?
  // split to home + appState method
  async deleteContact() {
    const { id } = this.getPageState();
    const contact = await this.findContact(id);
    if (!contact) {
      alert(`Invalid id: ${id}`);
      this.navTo('/');
    }
    
    const confirmed = confirm('Are you sure? This operation is irreversible!');
    if (!confirmed) {
      this.navTo('/');
      return;
    } 

    try {
      const result = await xhrRequest('DELETE', `/api/contacts/${id}`);
      await this.fetchContacts();
    } catch(e) {
      console.error(e);
    } finally {
      history.replaceState(history.state, '', this.origin);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ContactManager(select('#app-container'));
});
