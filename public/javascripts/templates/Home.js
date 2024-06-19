import TemplateWrapper from "../classes/TemplateWrapper.js"

export default function Home(insertionCallback, appState) {
  const homeBar = `
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

  const contactList = `
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

  const wrapper = new TemplateWrapper([homeBar, contactList], insertionCallback, appState);

  const methods = {
    async draw() {
      const contacts = await this.drawContacts();
      super({ contacts });
      select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
    },
  
    // customElement - home
    // re-render only the contact list
    async drawContacts() {
      this.drawMatchingContacts();
    },
  
    // customElement - home
    handleSearchInput(e) {
      const field = select('#contact-name-search');
      // if (e.target !== field) return;
      const { value } = field;
      this.drawMatchingContacts(value);
    },

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
      const formatted = App.formatContacts(contacts);
      const newList = this.templates.contactList({ contacts: formatted, searchValue });
      this.insertionCallback(newList);
    },
  }

  return Object.assign(wrapper, methods);
}