import debounce from './debounce.js';
import * as helpers from './helpers.js';
const { select, selectAll, formToJson, xhrRequest } = helpers;

class App {
  constructor(container) {
    this.container = container;
    this.contacts = null;
    this.templates = null;
    this.initTemplates();
    this.homeButton = select('a[href="#home"]');
    this.homeButton.addEventListener('click', this.navHome.bind(this));
    this.drawHome();
    this.fetchContacts().then(() => this.drawContacts(this.contacts));
    this.handleSearchInput = debounce(this.handleSearchInput.bind(this), 200);
  }
  
  async fetchContacts() {
    const contactData = JSON.parse(await xhrRequest('GET', '/api/contacts', { dataType: 'json' }));
    console.table(contactData);
    this.contacts = contactData;
    // this.drawContacts(contactData);
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
    select('#contact-list').addEventListener('click', this.handleContactCardClick.bind(this));
  }

  navHome(e) {
    e.preventDefault();
    this.drawHome();
  }

  findContact(id) {

  }

  formatContacts(contacts) {
    return contacts.map((contact) => {
      const formattedNumber = helpers.formatNumber(contact.phone_number);
      return { ...contact, phone_number: formattedNumber };
    });
  }

  // re-render only the contact list
  drawContacts() {
    this.drawMatchingContacts(this.contacts ?? {}, '');
    // // const appContainer = select('#app-container');
    // const existingList = select('#contact-list');
    // if (existingList) existingList.remove();
    // const contacts = this.formatContacts(this.contacts);
    // const newList = this.templates.contactList({ contacts });
    // this.container.insertAdjacentHTML('beforeend', newList);
  }

  // render contacts that match the search
  drawMatchingContacts(contacts, searchValue) {
    // const appContainer = select('#app-container');
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    const formatted = this.formatContacts(contacts);
    const newList = this.templates.contactList({ contacts: formatted, searchValue });
    this.container.insertAdjacentHTML('beforeend', newList);
    select('#contact-list').addEventListener('click', this.handleContactCardClick.bind(this));
  }

  navAddContact(e) {
    e.preventDefault();
    this.drawAddContactForm();
  }

  drawAddContactForm() {
    const createContactPage = this.templates.createContact();
    this.container.innerHTML = createContactPage;
    select('#contact-form').addEventListener('submit', this.createContact.bind(this));
    
    select('#contact-form-cancel').addEventListener('click', (e) => {
      e.preventDefault();
      this.drawHome();
    });
  }

  drawFormHints(form) {

  }

  async createContact(e) {
    e.preventDefault();
    const formObj = Object.fromEntries(new FormData(e.currentTarget));
    const conditions = [
      formObj.full_name.trim().length > 0,
      formObj.email.match(/[\w]+@[\w]+\.\w{2,}/),
      formObj.phone_number.match(/^(\s*)(\+\d{1,2})?([\s-]?)(\(?)(\d{3})(\)?)[\s-]?(\d{3})[\s-]?(\d{4})\s*$/),
    ];
    console.log({formObj, conditions})
    if (!conditions.every((condition) => condition)) {
      this.drawFormHints(e.currentTarget);
      return false;
    }
    
    const json = JSON.stringify(formObj);
    console.log(json);
    const result = await xhrRequest(
      'POST',
      '/api/contacts',
      { 'Content-Type': 'application/json; charset=utf-8' },
      json,
    );
    const newContacts = await this.fetchContacts();
    this.homeButton.dispatchEvent(new MouseEvent('click'));
    // alert(!!result ? `Contact created` : 'Failed to create the contact');
  }

  handleSearchInput(e) {
    const field = select('#contact-name-search');
    if (e.target !== field) return;
    const { value } = field;
    const pattern = new RegExp(`${value}`, 'i');
    const matches = this.contacts.filter((contact) => contact.full_name.match(pattern));
    this.drawMatchingContacts(matches, value);
  }

  handleContactCardClick(e) {
    const el = e.target;
    if (!el.classList.contains('btn')) return;
    e.preventDefault();
    if (el.classList.contains('edit')) {
      this.drawEditContactForm(e);
    } else if (el.classList.contains('delete')) {
      this.deleteContact(e);
    }
  }

  async drawEditContactForm(e) {
    const el = e.target;
    const href = el.getAttribute('href');
    const id = href.split('/').slice(-1)[0];
    const contact = this.contacts.find((contact) => String(contact.id) === id);
    this.container.innerHTML = this.templates.editContact({ contact });

    select('#contact-form-cancel').addEventListener('click', (e) => {
      e.preventDefault();
      this.drawHome();
    });
  }

  async deleteContact(e) {
    const el = e.target;
    const href = el.getAttribute('href');
    const id = href.split('/').slice(-1)[0];
    try {
      const result = await xhrRequest('DELETE', `/api/contacts/${id}`);
      this.contacts = this.contacts.filter((contact) => String(contact.id) !== id);
    } catch(e) {
      console.error(e);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App(select('#app-container'));
});