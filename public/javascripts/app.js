import debounce from './debounce.js';
import * as helpers from './helpers.js';
const { select, selectAll, xhrRequest } = helpers;

class App {
  constructor(container) {
    this.container = container;
    this.contacts = null;
    this.templates = null;
    // this.paths = {
    //   home: this.templates['homePage'],
    //   edit: this.templates['editContact'],
    //   create: this.templates['createContact'],
    // }
    this.initTemplates();
    this.fetchContacts();
    // this.initPages();
    // this.draw(this.pages.home());
    // console.log(this.pages.home())
    // this.handleSearchInput = debounce(this.handleSearchInput.bind(this), 200);
  }
  
  async fetchContacts() {
    const contactData = JSON.parse(await xhrRequest('GET', '/api/contacts', { dataType: 'json' }));
    console.table(contactData);
    this.contacts = contactData;
    this.draw(this.templates.homePage({contacts: this.contacts}));
    this.bindEvents();
  }

  // navigateHome() {
  //   this.setBody(this.pages.home(this.contacts));
  // }

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

    console.table(this.templates);
  }

  // initPages() {
  //   this.pages = {
  //     home: (contacts) => [this.templates.homeActions(), this.templates.contactList({ contacts }), this.templates.placeholderText()],
  //     'contacts/new': () => [this.templates.createContact()],
  //     'contacts/edit': (contact) => [this.templates.editContact({ contact })],
  //   };
  // }

  // unbindEvents() {
  //   this.newContactButton = select('a[href="#contacts/new"]');
  //   this.searchBox = select('#contact-name-search');
  //   this.newContactButton?.removeEventListener('click', this.navAddContact.bind(this));
  //   this.searchBox?.removeEventListener('input', this.handleSearchInput.bind(this));
  // }

  bindEvents() {

    this.homeButton = select('a[href="#home"]');
    this.homeButton.addEventListener('click', this.navHome.bind(this));
  
    const homeActionBar = select('.home.actions');
    homeActionBar.addEventListener('click', this.navAddContact.bind(this));
    homeActionBar.addEventListener('input', this.handleSearchInput.bind(this));
    console.log('events bound', this.newContactButton)
  }

  // add the new elements, then remove the previous ones once they finish transitioning in
  draw(template) {
    const bodyContainer = select('.app.container');
    // const previousElements = [...bodyContainer.children];
    bodyContainer.innerHTML = template;

    // previousElements.forEach((element) => element.remove());
  };

  navHome(e) {
    e.preventDefault();
    const { href, origin } = window.location;
    const anchorLink = e.target.getAttribute('href');
    const navPath = helpers.stringSubtract(href, origin);
    console.log({navPath, anchorLink});
    this.draw(this.templates.homePage({ contacts: this.contacts }));
    // history.pushState({}, "", navPath);
  }

  navAddContact(e) {
    const addContactButton = select('.btn.add-contact');
    console.log({navaddtarget: e.target, addContactButton, isSame: e.target === addContactButton})
    if (e.target !== addContactButton) return;
    e.preventDefault();
    const { href, origin } = window.location;
    const anchorLink = e.target.getAttribute('href');
    const navPath = helpers.stringSubtract(href, origin);
    console.log({navPath, anchorLink});
    this.draw(this.templates.createContact());
    // history.pushState({}, "", navPath);
  }

  // navigate(target, templateValues = null, e) {
  //   e.preventDefault();
  //   console.log({location: window.location})
  //   const href = e.currentTarget.getAttribute('href');
  //   console.log(`Navigating to /${href}`);
  //   this.setBody(this.pages[target](templateValues));
  //   history.pushState({}, "", href);
  // }
  
  handleSearchInput() {
    const field = select('#contact-name-search');
    if (e.target !== field) return;
    const { value } = this.searchBox;
    console.log('field text: ', value)
    const pattern = new RegExp(`${value}`, 'i');
    const matches = this.contacts
      .filter((contact) => contact.full_name.match(pattern));
    console.log({pattern, matches})
    this.draw(this.templates.homePage({ contacts: matches }));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App(select('#app-container'));
});
