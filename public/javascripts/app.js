import debounce from './debounce.js';
import * as helpers from './helpers.js';
const { select, selectAll, create, formToJson, xhrRequest } = helpers;

class App {
  static routeMatchRegex(routePath) {
    const hashReplace = /^#/.test(routePath) ? '#' : '';
    const patternString = routePath
      .replace(/^#/, '')
      .split('/')
      .map((segment) => segment.replace(/(:\w+)/, "\\w+"))
      .join('/');
    return new RegExp(`^${hashReplace}${patternString}/?$`, 'i');
  }

  static pathSegments(path) {
    return path?.replace(/^#/, '').split('/') ?? null;
  }

  static extractParams(navPath, routePath) {
    const routeSegments = App.pathSegments(routePath);
    const navSegments = App.pathSegments(navPath);
  
    return navSegments.reduce((acc, value, i) => {
      const paramSegment = routeSegments[i];
      if (!paramSegment.match(/^:/)) return acc;
      return Object.assign(acc, { [paramSegment.slice(1)]: value });
    }, {});
  }

  static logNav(...args) {
    console.log(new Date().toLocaleTimeString(), JSON.stringify(...args));
  }

  /**
   * Create a Handlebars template.
   * Has the side effect of removing the corresponding template script from the document.
   * @param {string | HTMLScriptElement} arg a CSS selector or a Handlebars script
   * @returns A Handlebars template function
   */
  static makeTemplate(arg) {
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

  static formatContacts(contacts) {
    return contacts.map((contact) => {
      const formatted = {
        phone_number: helpers.formatNumber(contact.phone_number),
        tags: contact.tags?.split(',').join(', '),
      };
      return { ...contact, ...formatted };
    });
  }

  #state = {
    contacts: null,
    pageVars: null,
  };

  constructor(container) {
    this.container = container;
    this.origin = window.location.origin;
    this.boundClickHandler = this.handleNavClick.bind(this);

    this.routes = {
      '#home': () => this.drawHome(),
      '#contacts/new': () => this.drawAddContactForm(),
      '#contacts/edit/:id': ({ path }) => this.drawEditContactForm(path),
      '#contacts/delete/:id': ({ path }) => this.deleteContact(path),
    };
    this.initTemplates();
    this.homeButton = select('#home-button');
    this.refresh();
    this.handleSearchInput = debounce(this.handleSearchInput.bind(this), 300);
  }

  matchPath(navPath) {
    return Object.keys(this.routes)
    .map((path) => ({ path, pattern: App.routeMatchRegex(path) }))
    .find(({ path, pattern }) => navPath.match(pattern))
    ?.path;
  }

  sameOrigin(path) {
    return !URL.canParse(path) || new URL(path).origin === this.origin;
  }

  validPath(path) {
    return (typeof path === 'string') 
      && (path.length === 0 || path.match(/(^#\w+)|(^\/$)/))
      && this.sameOrigin(path);
  }

  refresh() {
    this.navTo(window.location.hash);
  }

  handleNavClick(e) {
    const target = e.currentTarget.getAttribute('href');
    if (e.currentTarget.classList.contains('delete')) {
      const confirmed = confirm('Are you sure? This operation is irreversible!');
      if (!confirmed) {
        history.back();
        return;
      }
    }
    this.navTo(target, e);
  }

  navTo(path, event = undefined) {
    // If the link isn't to the same origin, isn't '/', or doesn't have a hash, return
    if (path && !this.validPath(path)) {
      alert(`invalid path ${path}`);
      return;
    };

    event?.preventDefault();

    // identify the target page and set up the values to pass
    // if the target isn't found, draw a 404 page (or simply navigate home)
    const target = this.matchPath(path) ?? '#home';

    // extract the route params to an object
    const params = target.match(/:/) ? App.extractParams(path, target) : { };
    App.logNav({ path, target })
    this.manageHistory(params, path);

    this.routes[target](params);
  }

  get state() {
    return this.#state;
  }

  set state(arg) {
    if (typeof arg === 'function') {
      this.#state = arg({ ...this.#state });
    } else if (typeof arg === 'object') {
      this.#state = { ...this.#state, ...arg };
    }  else return;
  }

  setPageState(pageVars) {
    this.state = { pageVars };
  }

  resetPageState() {
    this.state = { pageVars: null };
  }

  manageHistory(pageState, path) {
    history.replaceState(this.state.pageVars, '', window.location.pathname);
    history.pushState(pageState, '', new URL(path, this.origin));
    this.setPageState(pageState);
  }

  async getContacts() {
    return await (this.state.contacts ?? this.fetchContacts());
  }

  async getTags() {
    return [...new Set((await this.getContacts()).reduce((str, contact) => {
      if (!contact.tags) return str;
      if (!str) return contact.tags;
      return [str, contact.tags].join(',');
    }, '').split(','))];
  }

  async fetchContacts() {
    const contactData = JSON.parse(await xhrRequest('GET', '/api/contacts', { dataType: 'json' }));
    console.table(contactData);
    this.state.contacts = contactData;
    return contactData;
  }

  initTemplates() {
    const templateScripts = selectAll('script[type="text/x-handlebars"]');
    this.templates = templateScripts
      .reduce((acc, script) => {
        const template = App.makeTemplate(script);
        return template === undefined ? acc : Object.assign(acc, { [script.id]: template });
      }, {});
    console.log('Templates:');
    console.table(this.templates);
  }

  bindEvents() {
    
  }

  // re-render the entire app container
  draw(...templates) {
    this.container.innerHTML = templates[0];
    templates.slice(1).forEach((template) => this.container.insertAdjacentHTML('beforeend', template));
    selectAll('.navigation').forEach((link) => {
      link.removeEventListener('click', this.boundClickHandler);
      link.addEventListener('click', this.boundClickHandler);
      link.addEventListener('auxclick', (e) => e.preventDefault());
    });
  };

  async drawHome() {
    const contacts = await this.getContacts();
    const { homeActions, contactList } = this.templates;
    this.draw(homeActions());
    await this.drawContacts();
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
  }

  // re-render only the contact list
  async drawContacts() {
    this.drawMatchingContacts();
  }

  // render contacts that match the search
  async drawMatchingContacts(searchValue) {
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    let contacts = await this.getContacts();
    if (searchValue !== undefined) {
      const pattern = new RegExp(`${searchValue}`, 'i');
      contacts = contacts.filter((contact) => contact.full_name.match(pattern));
    }
    const formatted = App.formatContacts(contacts);
    const newList = this.templates.contactList({ contacts: formatted, searchValue });
    this.container.insertAdjacentHTML('beforeend', newList);
  }

  async drawAddContactForm() {
    const tags = await this.getTags();
    console.log(tags)
    const createContactPage = this.templates.createContact;
    this.draw(createContactPage({ tags }));
    select('#contact-form').addEventListener('submit', this.submitContactForm.bind(this));
    
    select('#contact-form-cancel').addEventListener('click', (e) => {
      e.preventDefault();
      this.navTo('/');
    });

    select('#create-tag').addEventListener
  }

  drawFormHints(form, conditions) {
    selectAll('.form-hint').forEach((hint) => hint.remove());
    [...form.querySelectorAll('.invalid')]
      .forEach((input) => input.classList.remove('invalid'));
    const hint = this.templates.contactFormHint;
    conditions.forEach(([key, { message }]) => {
      const location = form.querySelector(`input[name="${key}"]`);
      const label = form.querySelector(`label[for="${key}"`);
      location.classList.add('invalid');
      label.classList.add('invalid');
      location.insertAdjacentHTML('afterend', hint({ message }));
    })
  }

  validateContactForm(formObj) {
    const phoneNumberPattern = /^(\s*)(\+\d{1,2})?([\s-]?)(\(?)(\d{3})(\)?)[\s-]?(\d{3})[\s-]?(\d{4})\s*$/;
    const conditions = {
      'full_name': {
        check: formObj.full_name.trim().length > 0,
        message: 'You must provide a name.',
      },
      'email': {
        check: !!formObj.email.match(/[\w]+@[\w]+\.\w{2,}/),
        message: 'Email must have a name, domain, and @ sign.',
      },
      'phone_number': {
        check: !!formObj.phone_number.match(phoneNumberPattern),
        message: 'Please enter a valid US phone number.',
      },
    };
    const failing = Object.entries(conditions).filter(([key, { check }]) => !check);
    console.log({formObj, failing})
    return failing;
  }

  async submitContactForm(e) {
    console.log(e);
    e.preventDefault();
    const formObj = Object.fromEntries(new FormData(e.currentTarget));
    const failedConditions = this.validateContactForm(formObj);
    if (failedConditions.length) {
      this.drawFormHints(e.currentTarget, failedConditions);
      return false;
    }
    
    const json = JSON.stringify(formObj);
    console.log(json);
    const [method, path] = formObj.id
      ? ['PUT', `/api/contacts/${formObj.id}`] 
      : ['POST', '/api/contacts'];
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const result = await xhrRequest(method, path, headers, json);
    await this.fetchContacts();
    this.navTo('/');
  }

  handleSearchInput(e) {
    const field = select('#contact-name-search');
    if (e.target !== field) return;
    const { value } = field;
    this.drawMatchingContacts(value);
  }

  // handleContactCardClick(e) {
  //   alert('card clicked')
  //   const el = e.target;
  //   if (!el.classList.contains('btn')) return;
  //   e.preventDefault();
  //   if (el.classList.contains('edit')) {
  //     this.drawEditContactForm(e);
  //   } else if (el.classList.contains('delete')) {
  //     this.deleteContact(e);
  //   }
  // }

  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  async drawEditContactForm() {
    const { id } = this.state.pageVars;
    const tags = await this.getTags();
    const contact = await this.findContact(id);
    if (!contact) {
      alert(`Invalid id: ${id}`);
      this.navTo('/');
    }
    this.draw(this.templates.editContact({ contact, tags }));
    select('#contact-form').addEventListener('submit', this.submitContactForm.bind(this));

    const cancelButton = select('#contact-form-cancel');
    cancelButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.navTo('/');
    });
  }

  async deleteContact() {
    const { id } = this.state.pageVars;
    const contact = await this.findContact(id);
    if (!contact) {
      alert(`Invalid id: ${id}`);
      this.navTo('/');
    }

    try {
      const result = await xhrRequest('DELETE', `/api/contacts/${id}`);
      await this.fetchContacts();
    } catch(e) {
      console.error(e);
    } finally {
      location.replace(this.origin);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App(select('#app-container'));
  history.scrollRestoration = "auto";  

  window.addEventListener('popstate', (e) => {
    app.refresh();
  });
  
});