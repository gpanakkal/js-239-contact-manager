import ContactManagerState from "./classes/ContactManagerState.js";
import Router from "./classes/Router.js";
import { select } from "./lib/helpers.js";
import CreateContactForm from "./templates/CreateContactForm.js";
import EditContactForm from "./templates/EditContactForm.js";
import Home from "./templates/Home.js";

class ContactManager {
  constructor(container) {
    this.container = container;
    this.insertionCallback = (html) => this.container.insertAdjacentHTML('beforeend', html);
    this.state = new ContactManagerState();

    // define routes and the corresponding template wrappers used to construct the page
    this.routes = {
      '/': this.pages(Home),
      '#home': this.pages(Home),
      '#contacts/new': this.pages(CreateContactForm),
      '#contacts/edit/:id': this.pages(EditContactForm),
    };

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
