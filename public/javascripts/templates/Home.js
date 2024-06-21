import TagAutocomplete from "../classes/TagAutocomplete.js";
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
        <h3>There are no contacts with {{searchValue}}.</h3>
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
    new TagAutocomplete(select('#contact-tag-search'), this.appState.getTagSet.bind(this.appState));
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
    select('#contact-tag-search').addEventListener('input', this.handleSearchInput.bind(this));
    select('#contact-tag-search').addEventListener('autocomplete-cleared', this.handleSearchInput.bind(this));
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }

  handleSearchInput() {
    const nameSearchValue = select('#contact-name-search').value;
    const tagSearchStr = select('#contact-tag-search').value;
    const tagSearchValue = tagSearchStr.split(',').map((tag) => tag.trim()).filter((tag) => tag.length);
    this.drawMatchingContacts({ full_name: nameSearchValue, tagArray: tagSearchValue });
  }

  handleDeleteClick(e) {
    if (!e.target.classList.contains('delete')) return;
    e.preventDefault();
    const confirmed = confirm('Are you sure? This operation is irreversible!');
    if (!confirmed) return;
    const { id } = e.target.dataset;
    const { value: nameSearchValue } = select('#contact-name-search');
    const { value: tagSearchString } = select('#contact-tag-search');
    const tagSearchValue = tagSearchString.split(',').map((tag) => tag.trim());
    this.appState.deleteContact(id).then((result) => this
      .drawMatchingContacts({ full_name: nameSearchValue, tagArray: tagSearchValue}));
  }

  // render all contacts
  // remove?
  // async drawContacts() {
  //   this.drawMatchingContacts();
  // }

  /**
   * Draws contacts that match all of the provided search parameters
   * @param {{ full_name?: string, tagArray?: string[] }} The search values to use
   */
  async drawMatchingContacts({ full_name, tagArray }) {
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
    let contacts = await this.appState.getContacts();
    let searchValueArr = [];
    if (full_name) {
      const namePattern = new RegExp(full_name, 'i');
      contacts = contacts.filter((contact) => namePattern.test(contact.full_name));
      searchValueArr.push(`a name matching "${full_name}"`);
    }
    if (tagArray) {
      if (!Array.isArray(tagArray)) throw new TypeError(`Must pass tags as an array!`);
      if (tagArray.length) {
        const tagHash = hashIterable(tagArray);
        contacts = contacts.filter((contact) => {
          return Array.isArray(contact.tags) && contact.tags.some((tag) => tag in tagHash);
        });
        searchValueArr.push(`tags matching "${tagArray}"`);
      }
    }
    const formatted = this.appState.formatContacts(contacts);
    const searchValue = searchValueArr.join(' or ');
    const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
    this.insertionCallback(newList);
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }
}

export default ((insertionCallback, appState) => new Home(insertionCallback, appState));