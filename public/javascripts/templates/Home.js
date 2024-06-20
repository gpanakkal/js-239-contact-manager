import TemplateWrapper from "../classes/TemplateWrapper.js"
import { select } from "../lib/helpers.js";

const homeBar = /* html */ `
<script id="homeActions" type="text/x-handlebars" nonce=''>
  <div class="home actions">
    <div>
      <a class="navigation btn large add-contact" href="#contacts/new">Add Contact</a>
    </div>
    <div>
      <input 
        name="contact-name-search" 
        id="contact-name-search" 
        class="contact-name-search" 
        placeholder="Search"
        value="{{searchValue}}"
      >
    </div>
  </div>
</script>`;

const contactList = /* html */ `
<script id="contactList" type="text/x-handlebars" nonce=''>
  {{#if contacts}}
    <div id='contact-list' class='contact-list-grid'>
      {{#if contacts.length}}
        {{#each contacts}}
          {{> contactCardPartial}}
        {{/each}}
      {{/if}}
    </div>
  {{else}}
    {{#if searchValue}}
      <div id="contact-list" class="no-contacts">
        <h3>There are no contacts matching <strong>{{searchValue}}</strong>.</h3>
      </div>
    {{else}}
      <div id="contact-list" class="no-contacts">
        <h3>There are no contacts yet.</h3>
      </div>
    {{/if}}
  {{/if}}
</script>`;

class Home extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([homeBar, contactList], insertionCallback, appState);
  }

  async draw() {
    const contacts = await this.appState.getContacts();
    const formatted = this.appState.formatContacts(contacts);
    super.draw({ contacts: formatted });
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }

  // customElement - home
  // re-render only the contact list
  async drawContacts() {
    this.drawMatchingContacts();
  }

  // customElement - home
  handleSearchInput(e) {
    console.log({ searchEvent: e })
    e.preventDefault();
    const { value } = e.currentTarget;
    console.log({ value })
    console.warn({ HomeSearchState: history.state })
    this.drawMatchingContacts(value ?? '');
  }

  handleDeleteClick(e) {
    if (!e.target.classList.contains('delete')) return;
    e.preventDefault();
    const confirmed = confirm('Are you sure? This operation is irreversible!');
    if (!confirmed) return;
    const { id } = e.target.dataset;
    const { value } = select('#contact-name-search');
    this.appState.deleteContact(id).then((result) => this.drawMatchingContacts(value));
  }

  // customElement - home
  // render contacts that match the search
  async drawMatchingContacts(searchValue) {
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    let contacts = await this.appState.getContacts();
    if (searchValue !== undefined) {
      const pattern = new RegExp(`${searchValue}`, 'i');
      contacts = contacts.filter((contact) => contact.full_name.match(pattern));
    }
    const formatted = this.appState.formatContacts(contacts);
    console.log({contacts})
    const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
    this.insertionCallback(newList);
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }
}

export default ((insertionCallback, appState) => new Home(insertionCallback, appState));