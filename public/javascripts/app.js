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
    this.initTemplates();

    this.routes = {
      '#home': () => this.drawHome(),
      '#contacts/new': () => this.drawAddContactForm(),
      '#contacts/edit/:id': ({ path }) => this.drawEditContactForm(path),
      '#contacts/delete/:id': ({ path }) => this.deleteContact(path),
    };

    this.refresh();
    // this.handleSearchInput = debounce(this.handleSearchInput.bind(this), 300);
    // this.handleTagInput = debounce(this.handleTagInput.bind(this), 200);
  }

  matchRoute(navPath) {
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
    // if (e.currentTarget.classList.contains('delete')) {
    //   const confirmed = confirm('Are you sure? This operation is irreversible!');
    //   console.log({confirmed})
    //   if (confirmed) {
    //     this.navTo(target, e);
    //   } else {
    //     this.navTo('/');
    //   }
    // } else {
      this.navTo(target, e);
    // }
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
    const target = this.matchRoute(path) ?? '#home';

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
      console.log('Initial state:');
      console.log({state: this.#state, update: arg })
      this.#state = { ...this.#state, ...arg };
      console.log('After update:');
      console.log({state: this.#state })

    }  else return;
  }

  getPageState() {
    return this.state.pageVars;
  }

  setPageState(pageVars) {
    this.state = { pageVars };
  }

  updatePageState(updateVars) {
    this.setPageState({...this.getPageState(), ...updateVars});
  }

  resetPageState() {
    this.state = { pageVars: null };
  }

  manageHistory(pageState, path) {
    history.replaceState(this.getPageState(), '', window.location.pathname);
    history.pushState(pageState, '', new URL(path, this.origin));
    this.setPageState(pageState);
  }

  async getTags() {
    return [...new Set((await this.getContacts()).reduce((str, contact) => {
      if (!contact.tags) return str;
      if (!str) return contact.tags;
      return [str, contact.tags].join(',');
    }, '').split(','))];
  }

  async getContacts() {
    return await (this.state.contacts ?? this.fetchContacts());
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

  // re-render the entire app container
  draw(...htmlTemplates) {
    this.container.innerHTML = htmlTemplates[0];
    htmlTemplates.slice(1).forEach((template) => this.container.insertAdjacentHTML('beforeend', template));
    this.bindNavigationEvents();
  };

  bindNavigationEvents() {
    selectAll('.navigation').forEach((link) => {
      link.removeEventListener('click', this.boundClickHandler);
      link.addEventListener('click', this.boundClickHandler);
      link.addEventListener('auxclick', (e) => e.preventDefault());
    });
  }

  async drawHome() {
    // const contacts = await this.getContacts();
    // const { homeActions } = this.templates;
    this.draw(this.templates.homeActions());
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

  bindContactFormEvents() {
    select('#contact-form').addEventListener('submit', this.submitContactForm.bind(this));
    
    select('#contact-form-cancel').addEventListener('click', (e) => {
      e.preventDefault();
      this.navTo('/');
    });

    const tagInput = select('#tag-input');
    tagInput.addEventListener('input', this.handleTagInput.bind(this));
    tagInput.addEventListener('keydown', this.handleTagNav.bind(this));
    tagInput.querySelector
  }

  async drawAddContactForm() {
    const tags = await this.getTags();
    console.log(tags)
    const createContactPage = this.templates.createContact;
    this.draw(createContactPage({ tags }));
    this.bindContactFormEvents();
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
    // if (e.target !== field) return;
    const { value } = field;
    this.drawMatchingContacts(value);
  }

  async processTags(tagString) {
    const allTags = await this.getTags();
    const tags = tagString.trim().split(',').map((tag) => tag.trim());
    const lastTag = tags[tags.length - 1];
    const currentTags = helpers.hashIterable(tags.slice(0, -1));
    const tagPattern = new RegExp(lastTag, 'i');
    const matches = allTags.filter((tag) => !(tag in currentTags) && tag.match(tagPattern));
    console.log({tagString, lastTag, matches});
    return [tags, matches];
  }

  findTag(value) {
    const selector = `.autocomplete-ui-choice[value="${value}"]`;
    console.log(selector, select(selector));
    return select(selector);
  }

  highlightMatchingTag(tag) {
    const tagList = selectAll('.autocomplete-ui-choice');
    tagList.forEach((li) => li.classList.remove('highlighted'));
    tag?.classList.add('highlighted');
  }

  async handleTagInput(e) {
    const field = select('#tag-input');
    selectAll('li.autocomplete-ui-choice').forEach((el) => el.remove());
    const { value: tagString } = field;
    if (tagString.length === 0) return;
    const [tags, matches] = await this.processTags(tagString);

    this.setPageState({ tagInput: tags, matches, bestMatch: 0 });
    const suggestions = this.templates.contactFormTags;

    select('ul.autocomplete-ui').innerHTML = suggestions({ tags: matches });
    const firstTag = select('.autocomplete-ui-choice');

    this.highlightMatchingTag(firstTag);
  }

  handleTagNav(e) {
    const field = select('#tag-input');
    const tagList = selectAll('.autocomplete-ui-choice');
    const { tagInput, matches, bestMatch } = this.getPageState();
    const nextIndex = (i) => i >= matches.length - 1 ? 0 : i + 1;
    const prevIndex = (i) => i <= 0 ? matches.length - 1 : i - 1;
    const selectNew = (i) => {
      this.updatePageState({ bestMatch: i });
      this.highlightMatchingTag(this.findTag(matches[i]));
    }

    const keyActions = {
      'ArrowDown': () => {
        e.preventDefault();
        selectNew(nextIndex(bestMatch));
      },
      'ArrowUp': () => {
        e.preventDefault();
        selectNew(prevIndex(bestMatch));
      },
      'Tab': () => {
        if (bestMatch === undefined) return;
        e.preventDefault();
        // replace the partial tag with the full one
        const newTag = this.findTag(bestMatch);
        console.log({ bestMatch, newTag })
        const newTagString = [...tagInput.slice(0, -1), newTag].join(', ');
        field.value = newTagString;
        selectNew(null);
      },
    }

    if (e.key in keyActions) {
      keyActions[e.key]();
    }
  }

  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  async drawEditContactForm() {
    const { id } = this.getPageState();
    const contact = await this.findContact(id);
    this.updatePageState({ ...contact });
    const tags = await this.getTags();
    if (!contact) {
      alert(`Invalid id: ${id}`);
      this.navTo('/');
    }

    this.draw(this.templates.editContact({ contact, tags }));
    this.bindContactFormEvents();
  }

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