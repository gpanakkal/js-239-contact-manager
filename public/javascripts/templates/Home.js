import Autocomplete from "../classes/Autocomplete.js";
import TemplateWrapper from "../classes/TemplateWrapper.js"
import { hashIterable, select } from "../lib/helpers.js";

const homeBar = /* html */ `
<script id="homeActions" type="text/x-handlebars" nonce=''>
  <div class="home actions">
    <div>
      <a class="navigation btn large add-contact" href="#contacts/new">Add Contact</a>
    </div>
    <div>
      <input 
        name="contact-tag-search" 
        id="contact-tag-search" 
        class="contact-tag-search" 
        placeholder="Filter by tags..."
        value="{{searchValue}}"
      >
    </div>
    <div>
      <input 
        name="contact-name-search" 
        id="contact-name-search" 
        class="contact-name-search" 
        placeholder="Filter by name..."
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
    this.#iniTagAutocomplete();
    select('#contact-name-search').addEventListener('input', this.handleNameSearchInput.bind(this));
    select('#contact-id-search').addEventListener('input', this.handleTagSearchInput.bind(this));
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }

  // customElement - home
  // re-render only the contact list
  async drawContacts() {
    this.drawMatchingContacts();
  }

  // need to split this up if I want to prevent the default action
  async handleTagSearchInput(e) {
    const { value } = e.currentTarget;
    const allContacts = await this.appState.getContacts();
    const matchingContacts = allContacts
      .filter((contact) => contact.tags.some((tag) => tag.includes(value)));
    this.drawMatchingContacts({ searchKey: 'tags', searchValue: ''})
  }

  #iniTagAutocomplete() {
    // given a string of comma-separated tags, get the final tag and return all tags that contain the input,
    // sorted by the precedence of the match
    const tagMatcher = (tagInputText, tagValues) => {
      const tags = tagInputText.split(',').map((tag) => tag.trim());
      const lastTag = tags[tags.length - 1].toLowerCase();
      const otherTags = hashIterable(tags.slice(0, -1));
      const matchingTags = tagValues.filter((value) => {
        const tagPresent = (value.toLowerCase() in otherTags);
        const lastTagMatches = value.toLowerCase().includes(lastTag);
        return !tagPresent && lastTagMatches;
      });
      return matchingTags.toSorted((a, b) => a.toLowerCase().indexOf(lastTag) - b.toLowerCase().indexOf(lastTag));
    }

    const tagUpdateCb = (input, option) => {
      const previousTagArr = input.value.split(',').map((value) => value.trim()).slice(0, -1);
      const newTagStr = `${option.getAttribute('value')}, `;
      const withNewTag = previousTagArr.concat([newTagStr]).join(', ');
      return withNewTag;
    };

    new Autocomplete({
      inputElement: select('#contact-tag-search'),
      optionsLoader: this.appState.getTags.bind(this.appState),
      matchCallback: tagMatcher,
      fillCallback: tagUpdateCb,
    });
  }

  // customElement - home
  handleNameSearchInput(e) {
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
  async drawMatchingContacts({ searchKey, searchValue }) {
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    let contacts = await this.appState.getContacts();
    if (searchKey !== undefined && searchValue !== undefined) {
      const pattern = new RegExp(searchValue, 'i');
      contacts = contacts.filter((contact) => contact[searchKey].match(pattern));
    }
    const formatted = this.appState.formatContacts(contacts);
    const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
    this.insertionCallback(newList);
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }
}

export default ((insertionCallback, appState) => new Home(insertionCallback, appState));