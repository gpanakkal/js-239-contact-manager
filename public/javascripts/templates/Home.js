import TagAutocomplete from "../classes/TagAutocomplete.js";
import TemplateWrapper from "../classes/TemplateWrapper.js"
import { hashIterable, select, selectParent, htmlToElements } from "../lib/helpers.js";

const matchOptionPartial = /* html */ `
<script id="matchOptionPartial" data-template-type="partial" type="text/x-handlebars" nonce=''>
  <li class="autocomplete-ui-choice" value="{{match}}">{{match}}</li>
</script>`;

const contactCardPartial = /* html */`
<script id="contactCardPartial" data-template-type="partial" type="text/x-handlebars" nonce=''>
<div class="contact-card">
  <h3 class="cardHeading">{{full_name}}</h3>
  <dl>
    {{#if phone_number}}
    <dt>Phone Number:</dt>
    <dd>{{phone_number}}</dd>
    {{/if}}
    {{#if email}}
    <dt>Email:</dt>
    <dd>{{email}}</dd>
    {{/if}}
    {{#if tags}}
      <dt>Tags:</dt>
      <dd>{{#each tags}}#{{this}}{{#unless @last}}, {{/unless}}{{/each}}</dd>
    {{/if}}
  </dl>
  <div class="contact actions">
    <div><a class="navigation btn edit" href="#contacts/edit/{{id}}">Edit</a></div>
    <div><button type="button" class="btn delete" data-id="{{id}}">Delete</a></div>
  </div>
</div>
</script>`;

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
    super([contactCardPartial, matchOptionPartial, homeBar, contactList], insertionCallback, appState);
  }

  async draw() {
    const contacts = await this.appState.getContacts();
    const formatted = this.appState.formatContacts(contacts);
    super.draw({ contacts: formatted });
    const tagSearchField = select('#contact-tag-search');
    new TagAutocomplete(tagSearchField, this.appState.getTagSet.bind(this.appState));
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
    // select('#contact-tag-search').addEventListener('input', this.handleSearchInput.bind(this));
    select('#contact-tag-search').addEventListener('autocomplete-updated', this.handleSearchInput.bind(this));
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }

  handleSearchInput(e) {
    const nameSearchValue = select('#contact-name-search').value;
    const tagSearchStr = select('#contact-tag-search').value;
    const tagSearchValue = tagSearchStr.split(',').map((tag) => tag.trim()).filter((tag) => tag.length);
    this.drawMatchingContacts({ full_name: nameSearchValue, tagArray: tagSearchValue });
  }

  handleTagFieldClear(e) {
    
  }

  handleDeleteClick(e) {
    if (!e.target.classList.contains('delete')) return;
    e.preventDefault();
    const confirmed = confirm('Are you sure? This operation is irreversible!');
    if (!confirmed) return;
    const { id } = e.target.dataset;
    // const { value: nameSearchValue } = select('#contact-name-search');
    // const { value: tagSearchString } = select('#contact-tag-search');
    // const tagSearchValue = tagSearchString.split(',').map((tag) => tag.trim());
    this.appState.deleteContact(id)
      .then((result) => {
        const parent = selectParent('div.contact-card', e.target);
        parent.remove();
      }).catch((error) => alert('Contact was not deleted!'));
  }

  /**
   * Draws contacts that match all of the provided search parameters
   * @param {{ full_name?: string, tagArray?: string[] }} The search values to use
   */
  async drawMatchingContacts({ full_name, tagArray }) {
    let contacts = await this.appState.getContacts();
    const existingList = select('#contact-list');
    if (existingList) existingList.remove();
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
        const lastTag = tagArray[tagArray.length - 1];
        contacts = contacts.filter((contact) => {
          if (!Array.isArray(contact.tags)) return false;
          return contact.tags.some((tag) => tag in tagHash || tag.startsWith(lastTag));
        });
        searchValueArr.push(`tag${tagArray.length > 1 ? 's' : ''} "${tagArray}"`);
      }
    }
    const formatted = this.appState.formatContacts(contacts);
    const searchValue = searchValueArr.join(' and ');
    const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
    this.insertionCallback(newList);
    select('#contact-list').addEventListener('click', this.handleDeleteClick.bind(this));
  }
}

export default ((insertionCallback, appState) => new Home(insertionCallback, appState));