import debounce from './debounce.js';
import * as helpers from './helpers.js';
const { select, selectAll, xhrRequest } = helpers;

class App {
  constructor(container) {
    this.container = container;
    this.contacts = null;
    this.templates = null;
    this.initTemplates();
    this.homeButton = select('a[href="#home"]');
    this.homeButton.addEventListener('click', this.navHome.bind(this));
    this.drawHome();
    this.fetchContacts();
    this.handleSearchInput = debounce(this.handleSearchInput.bind(this), 200);
  }
  
  async fetchContacts() {
    const contactData = JSON.parse(await xhrRequest('GET', '/api/contacts', { dataType: 'json' }));
    console.table(contactData);
    this.contacts = contactData;
    this.drawContacts(contactData);
  }

  /**
   * Create a Handlebars template.
   * Has the side effect of removing the corresponding template script from the document.
   * @param {string | HTMLScriptElement} arg a CSS selector or a Handlebars script
   * @returns A Handlebars template function
   */
  makeTemplate(arg) {
    const script = typeof arg === 'string' ? select(arg) : arg;
    let template = undefined;
    if(script.dataset.type === 'partial') {
      Handlebars.registerPartial(script.id, script.innerHTML);
    } else {
      template = Handlebars.compile(script.innerHTML);
    }
    script.remove();
    // console.log({script, id: script.id, type: script.dataset.type, template})
    return template;
  }

  initTemplates() {
    const templateScripts = selectAll('script[type="text/x-handlebars"]');
    this.templates = templateScripts
      .reduce((acc, script) => {
        const template = this.makeTemplate(script);
        return template === undefined ? acc : Object.assign(acc, { [script.id]: template });
      }, {});
    console.log('Templates:');
    console.table(this.templates);
  }

  bindEvents() {
    // const homeActionBar = select('.home.actions');
    select('.btn.add-contact').addEventListener('click', this.navAddContact.bind(this));
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
  }

  // re-render the entire app container
  draw(...templates) {
    // const appContainer = select('#app-container');
    // const previousElements = [...bodyContainer.children];
    this.container.innerHTML = templates[0];
    templates.slice(1).forEach((template) => this.container.insertAdjacentHTML('beforeend', template));
    this.bindEvents();
    // previousElements.forEach((element) => element.remove());
  };

  drawHome() {
    const { homeActions, contactList } = this.templates;
    this.draw(homeActions(), contactList({ contacts: this.contacts }));
  }

  // re-render only the contact list
  drawContacts() {
    // const appContainer = select('#app-container');
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    const newList = this.templates.contactList({ contacts: this.contacts });
    this.container.insertAdjacentHTML('beforeend', newList);
  }

  // render contacts that match the search
  drawMatchingContacts(contacts, searchValue) {
    // const appContainer = select('#app-container');
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    const newList = this.templates.contactList({ contacts, searchValue });
    this.container.insertAdjacentHTML('beforeend', newList);
  }

  drawCreateContact() {
    const createContactPage = this.templates.createContact();
    this.container.innerHTML = createContactPage;
  }

  navHome(e) {
    e.preventDefault();
    // const { href, origin } = window.location;
    // const anchorLink = e.target.getAttribute('href');
    // const navPath = helpers.stringSubtract(href, origin);
    // console.log({navPath, anchorLink});
    this.drawHome();
    // history.pushState({}, "", navPath);
  }

  navAddContact(e) {
    // const addContactButton = select('.btn.add-contact');
    // console.log({navaddtarget: e.target, addContactButton, isSame: e.target === addContactButton})
    // if (e.target !== addContactButton) return;
    e.preventDefault();
    // const { href, origin } = window.location;
    // const anchorLink = e.target.getAttribute('href');
    // const navPath = helpers.stringSubtract(href, origin);
    // console.log({navPath, anchorLink});
    this.drawCreateContact();
    // history.pushState({}, "", navPath);
  }

  handleSearchInput(e) {
    // const field = select('#contact-name-search');
    // if (e.target !== field) return;
    const { value } = field;
    const pattern = new RegExp(`${value}`, 'i');
    const matches = this.contacts.filter((contact) => contact.full_name.match(pattern));
    this.drawMatchingContacts(matches, value);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App(select('#app-container'));
});