import TemplateWrapper from "../classes/TemplateWrapper.js"
import { select } from "../lib/helpers.js";

// temporary
// export default function Home(insertionCallback, appState) {
//   const homeBar = `
//   <script id="homeActions" type="text/x-handlebars" nonce=''>
//     <div class="home actions">
//       <div>
//         <a class="navigation btn large add-contact" href="#contacts/new">Add Contact</a>
//       </div>
//       <div>
//         <input 
//           name="contact-name-search" 
//           id="contact-name-search" 
//           class="contact-name-search" 
//           placeholder="Search"
//           value="{{searchValue}}"
//         >
//       </div>
//     </div>
//   </script>`;

//   const contactList = `
//   <script id="contactList" type="text/x-handlebars" nonce=''>
//     {{#if contacts}}
//       <div id='contact-list' class='contact-list-grid'>
//         {{#if contacts.length}}
//           {{#each contacts}}
//             {{> contactCardPartial}}
//           {{/each}}
//         {{/if}}
//       </div>
//     {{else}}
//       {{#if searchValue}}
//         <div id="contact-list" class="no-contacts">
//           <h3>There are no contacts matching <strong>{{searchValue}}</strong>.</h3>
//         </div>
//       {{else}}
//         <div id="contact-list" class="no-contacts">
//           <h3>There are no contacts yet.</h3>
//         </div>
//       {{/if}}
//     {{/if}}
//   </script>`;

//   const wrapper = new TemplateWrapper([homeBar, contactList], insertionCallback, appState);

//     wrapper.draw = async function(state) {
//       TemplateWrapper.prototype.draw.call(this, state);
//       select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
//     },
  
//     // customElement - home
//     // re-render only the contact list
//     wrapper.drawContacts = async function() {
//       this.drawMatchingContacts();
//     },
  
//     // customElement - home
//     wrapper.handleSearchInput = async function(e) {
//       const field = select('#contact-name-search');
//       // if (e.target !== field) return;
//       const { value } = field;
//       this.drawMatchingContacts(value);
//     },

//     // customElement - home
//     // render contacts that match the search
//     wrapper.drawMatchingContacts = async function(searchValue) {
//       const existingList = select('#contact-list');
//       if (existingList) existingList.remove();
//       let contacts = await this.appState.getContacts();
//       if (searchValue !== undefined) {
//         const pattern = new RegExp(`${searchValue}`, 'i');
//         contacts = contacts.filter((contact) => contact.full_name.match(pattern));
//       }
//       const formatted = this.appState.formatContacts(contacts);
//       const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
//       this.insertionCallback(newList);
//     }

//   return wrapper;
// }

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

class Home extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([homeBar, contactList], insertionCallback, appState);
  }

  draw(state) {
    super.draw(state);
    select('#contact-name-search').addEventListener('input', this.handleSearchInput.bind(this));
  }

  // customElement - home
  // re-render only the contact list
  async drawContacts() {
    this.drawMatchingContacts();
  }

  // customElement - home
  async handleSearchInput(e) {
    const field = select('#contact-name-search');
    // if (e.target !== field) return;
    const { value } = field;
    this.drawMatchingContacts(value);
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
    const newList = this.findTemplate('contactList')({ contacts: formatted, searchValue });
    this.insertionCallback(newList);
  }
}

export default ((insertionCallback, appState) => new Home(insertionCallback, appState));