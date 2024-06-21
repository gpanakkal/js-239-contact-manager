import AppState from "./classes/AppState.js";
import Router from "./classes/Router.js";
import { select, selectAll, xhrRequest } from "./lib/helpers.js";
import ContactForm from "./templates/ContactForm.js";
import CreateContactForm from "./templates/CreateContactForm.js";
import EditContactForm from "./templates/EditContactForm.js";
import Home from "./templates/Home.js";

class ContactManager {
  // static #registerPartials() {
  //   selectAll('script[type="text/x-handlebars"]')
  //     .filter((script) => script.dataset.type === 'partial')
  //     .forEach((partial) => {
  //       Handlebars.registerPartial(partial.id, partial.innerHTML)
  //       partial.remove()
  //     });
  // }

  constructor(container) {
    this.container = container;
    this.insertionCallback = (html) => this.container.insertAdjacentHTML('beforeend', html);
    // ContactManager.#registerPartials();
    this.state = new AppState();
    // define routes and corresponding templates used to construct the page
    this.routes = {
      '/': this.pages(Home),
      '#home': this.pages(Home),
      '#contacts/new': this.pages(CreateContactForm),
      '#contacts/edit/:id': this.pages(EditContactForm),
      '#contacts/delete/:id': this.pages(), // remove this - should be a contact API request only
    }
    this.router = new Router({
      appRoutes: this.routes,
      appContainer: this.container,
      appState: this.state,
    });
  }

  pages(...templateWrappers) {
    return templateWrappers.map((wrapper) => wrapper(this.insertionCallback, this.state));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ContactManager(select('#app-container'));
});
