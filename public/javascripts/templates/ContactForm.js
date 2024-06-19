import TemplateWrapper from "../classes/TemplateWrapper.js";
import { hashIterable, select, selectAll } from "../lib/helpers.js";

// export default function ContactForm(insertionCallback, appState) {
//   const contactForm = `
//   <script id="contactForm" type="text/x-handlebars" nonce=''>
//     <h2 class='page-header'>
//       {{#if contact}}Edit{{else}}Create{{/if}} Contact
//     </h2>
//     <form id="contact-form">
//       <div id="contact-form-grid">
//         <input type="hidden" name="id" id="id" value="{{contact.id}}">
//         <label for="full_name">Full name:</label>
//         <div class="input-box">
//           <input type="text" name="full_name" id="full_name" value="{{contact.full_name}}">
//         </div>
//         <label for="email">Email address:</label>
//         <div class="input-box">
//           <input type="email" name="email" id="email" value="{{contact.email}}">
//         </div>
//         <label for="phone_number">Telephone number:</label>
//         <div class="input-box">
//           <input type="tel" name="phone_number" id="phone_number" value="{{contact.phone_number}}">
//         </div>
//           <label for="tags">Tags:</label>
//           <div class="input-box">
//             <input type='text' name='tags' id="tags" value="{{contact.tags}}">
//             <div class="autocomplete-wrapper">
//               <ul class="autocomplete-ui">
//               </ul>
//             </div>
//           </div>
//         <label></label>
//         <button id="contact-form-submit" type="submit" class="btn large">Submit</button>
//         <a id="contact-form-cancel" href="/" class="btn large navigation">Cancel</a>
//       </div>
//     </form>
//   </script>
// `;

//   const contactFormTags = `
//   <script id="contactFormTags" type="text/x-handlebars" nonce=''>
//     {{#each tags}}
//       <li class="autocomplete-ui-choice" value={{this}}>{{this}}</li>
//     {{/each}}
//   </script>
// `;

//   const contactFormHint = `
//   <script id="contactFormHint" type="text/x-handlebars" nonce=''>
//     <small class="form-hint">{{message}}</small>
//   </script>
// `;

//   const wrapper = new TemplateWrapper([contactForm], insertionCallback, appState);

//   const methods = {
//     // customElement - contactForm
//     bindContactFormEvents() {
//       select('#contact-form').addEventListener('submit', this.handleFormSubmit.bind(this));
      
//       // select('#contact-form-cancel').addEventListener('click', (e) => {
//       //   e.preventDefault();
//         // history.back();
//         // const customNavEvent = new MouseEvent('click', )
//         // document.querySelector('#home-button').dispatchEvent(new MouseEvent('click')); // replace with a navigateback event listened to by router?
//       // });
  
//       const tagInput = select('#tags');
//       tagInput.addEventListener('input', this.handleTagInput.bind(this));
//       tagInput.addEventListener('keydown', this.handleTagNav.bind(this));
//       // tagInput.querySelector
//     },
  
//     // customElement - contactForm
//     async draw(state) {
//       console.log('drawing contact form--------------');
//       const contact = await appState.findContact(state.pageState.id);
//       TemplateWrapper.prototype.draw.call(this, {contact});
//       this.bindContactFormEvents();
//     },
  
//     // customElement - contactForm
//     drawFormHints(form, conditions) {
//       selectAll('.form-hint').forEach((hint) => hint.remove());
//       [...form.querySelectorAll('.invalid')]
//         .forEach((input) => input.classList.remove('invalid'));
//       const hint = this.templates.contactFormHint;
//       conditions.forEach(([key, { message }]) => {
//         const location = form.querySelector(`input[id="${key}"]`);
//         const label = form.querySelector(`label[for="${key}"`);
//         location.classList.add('invalid');
//         label.classList.add('invalid');
//         location.insertAdjacentHTML('afterend', hint({ message }));
//       })
//     },
  
//     // customElement - contactForm
//     validateContactForm(formObj) {
//       const phoneNumberPattern = /^(\s*)(\+\d{1,2})?([\s-]?)(\(?)(\d{3})(\)?)[\s-]?(\d{3})[\s-]?(\d{4})\s*$/;
//       const conditions = {
//         'full_name': {
//           check: formObj.full_name.trim().length > 0,
//           message: 'You must provide a name.',
//         },
//         'email': {
//           check: !!formObj.email.match(/[\w]+@[\w]+\.\w{2,}/),
//           message: 'Email must have a name, domain, and @ sign.',
//         },
//         'phone_number': {
//           check: !!formObj.phone_number.match(phoneNumberPattern),
//           message: 'Please enter a valid US phone number.',
//         },
//       };
//       const failing = Object.entries(conditions).filter(([key, { check }]) => !check);
//       console.log({formObj, failing})
//       return failing;
//     },

//     handleFormSubmit(e) {
//       // alert(e);
//       e.preventDefault();
//       const formObj = Object.fromEntries(new FormData(e.currentTarget));
//       const failedConditions = this.validateContactForm(formObj);
//       if (failedConditions.length) {
//         alert(`Failed conditions: ${failedConditions.map(([field, obj]) => obj.message).join(', ')}`)
//         this.drawFormHints(e.currentTarget, failedConditions);
//         return false;
//       }
//       this.submitContactForm(formObj);
//     },
  
//     // customElement - contactForm
//     async submitContactForm(formObj) {
//       const result = await (formObj.id 
//         ? this.appState.editContact(formObj) 
//         : this.appState.createContact(formObj));
//       document.querySelector('#home-button').dispatchEvent(new CustomEvent('click'));
//     },
  
//     // customElement - contactForm
//     async processTags(tagString) {
//       const allTags = await this.appState.getTags();
//       const tags = tagString.trim().split(',').map((tag) => tag.trim());
//       const lastTag = tags[tags.length - 1];
//       const currentTags = hashIterable(tags.slice(0, -1));
//       const tagPattern = new RegExp(lastTag, 'i');
//       const matches = allTags.filter((tag) => !(tag in currentTags) && tag.match(tagPattern));
//       console.log({tagString, lastTag, matches});
//       return [tags, matches];
//     },
  
//     // customElement - contactForm
//     findTag(value) {
//       const selector = `.autocomplete-ui-choice[value="${value}"]`;
//       console.log(selector, select(selector));
//       return select(selector);
//     },
  
//     // customElement - contactForm
//     highlightMatchingTag(tag) {
//       const tagList = selectAll('.autocomplete-ui-choice');
//       tagList.forEach((li) => li.classList.remove('highlighted'));
//       tag?.classList.add('highlighted');
//     },
  
//     // customElement - contactForm
//     async handleTagInput(e) {
//       const field = select('#tags');
//       selectAll('li.autocomplete-ui-choice').forEach((el) => el.remove());
//       const { value: tagString } = field;
//       if (tagString.length === 0) return;
//       const [tags, matches] = await this.processTags(tagString);
  
//       this.appState.setPage({ tagInput: tags, matches, bestMatch: 0 });
//       const suggestions = this.templates.contactFormTags;
  
//       select('ul.autocomplete-ui').innerHTML = suggestions({ tags: matches });
//       const firstTag = select('.autocomplete-ui-choice');
  
//       this.highlightMatchingTag(firstTag);
//     },
  
//     // customElement - contactForm
//     handleTagNav(e) {
//       const field = select('#tags');
//       const tagList = selectAll('.autocomplete-ui-choice');
//       const { tagInput, matches, bestMatch } = this.appState.getPage();
//       const nextIndex = (i) => i >= matches.length - 1 ? 0 : i + 1;
//       const prevIndex = (i) => i <= 0 ? matches.length - 1 : i - 1;
//       const selectNew = (i) => {
//         this.appState.updatePage({ bestMatch: i });
//         this.highlightMatchingTag(this.findTag(matches[i]));
//       }
  
//       const keyActions = {
//         'ArrowDown': () => {
//           e.preventDefault();
//           selectNew(nextIndex(bestMatch));
//         },
//         'ArrowUp': () => {
//           e.preventDefault();
//           selectNew(prevIndex(bestMatch));
//         },
//         'Tab': () => {
//           if (bestMatch === undefined) return;
//           e.preventDefault();
//           // replace the partial tag with the full one
//           const newTag = this.findTag(bestMatch);
//           console.log({ bestMatch, newTag })
//           const newTagString = [...tagInput.slice(0, -1), newTag].join(', ');
//           field.value = newTagString;
//           selectNew(null);
//         },
//       }
  
//       if (e.key in keyActions) {
//         keyActions[e.key]();
//       }
//     },
  
//     // custom element - contact form (as draw())
//     async drawEditContactForm() {
//       const { id } = this.appState.getPage(); // will be passed as an arg
//       const contact = await this.appState.findContact(id);
//       this.appState.updatePage({ ...contact });
//       const tags = await this.appState.getTags();
//       if (!contact) {
//         alert(`Invalid id: ${id}`);
//         document.querySelector('#home-button').dispatchEvent(new MouseEvent('click'));
//       }
  
//       this.draw(this.templates.editContact({ contact, tags }));
//       this.bindContactFormEvents();
//     },
//   }

//   return Object.assign(wrapper, methods);
// }

const contactForm = `
<script id="contactForm" type="text/x-handlebars" nonce=''>
  <h2 class='page-header'>
    {{#if contact}}Edit{{else}}Create{{/if}} Contact
  </h2>
  <form id="contact-form">
    <div id="contact-form-grid">
      <input type="hidden" name="id" id="id" value="{{contact.id}}">
      <label for="full_name">Full name:</label>
      <div class="input-box">
        <input type="text" autofocus name="full_name" id="full_name" value="{{contact.full_name}}">
      </div>
      <label for="email">Email address:</label>
      <div class="input-box">
        <input type="email" name="email" id="email" value="{{contact.email}}">
      </div>
      <label for="phone_number">Telephone number:</label>
      <div class="input-box">
        <input type="tel" name="phone_number" id="phone_number" value="{{contact.phone_number}}">
      </div>
        <label for="tags">Tags:</label>
        <div class="input-box">
          <input type='text' name='tags' id="tags" value="{{contact.tags}}">
          <div class="autocomplete-wrapper">
            <ul class="autocomplete-ui">
            </ul>
          </div>
        </div>
      <label></label>
      <button id="contact-form-submit" type="submit" class="btn large">Submit</button>
      <a id="contact-form-cancel" href="/" class="btn large navigation">Cancel</a>
    </div>
  </form>
</script>`;

const contactFormTags = `
<script id="contactFormTags" type="text/x-handlebars" nonce=''>
  {{#each tags}}
    <li class="autocomplete-ui-choice" value={{this}}>{{this}}</li>
  {{/each}}
</script>`;

const contactFormHint = `
<script id="contactFormHint" type="text/x-handlebars" nonce=''>
  <small class="form-hint">{{message}}</small>
</script>`;

class ContactForm extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([contactForm], insertionCallback, appState)
  }

  // customElement - contactForm
  bindContactFormEvents() {
    select('#contact-form').addEventListener('submit', this.handleFormSubmit.bind(this));
    const tagInput = select('#tags');
    tagInput.addEventListener('input', this.handleTagInput.bind(this));
    tagInput.addEventListener('keydown', this.handleTagNav.bind(this));
    // tagInput.querySelector
  }

  // customElement - contactForm
  async draw(state) {
    const contact = await this.appState.findContact(state.pageState.id);
    super.draw({ contact });
    // TemplateWrapper.prototype.draw.call(this, {contact});
    this.bindContactFormEvents();
  }

  // customElement - contactForm
  drawFormHints(form, conditions) {
    selectAll('.form-hint').forEach((hint) => hint.remove());
    [...form.querySelectorAll('.invalid')]
      .forEach((input) => input.classList.remove('invalid'));
    const hint = this.templates.contactFormHint;
    conditions.forEach(([key, { message }]) => {
      const location = form.querySelector(`input[id="${key}"]`);
      const label = form.querySelector(`label[for="${key}"`);
      location.classList.add('invalid');
      label.classList.add('invalid');
      location.insertAdjacentHTML('afterend', hint({ message }));
    });
  }

  // customElement - contactForm
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

  handleFormSubmit(e) {
    // alert(e);
    e.preventDefault();
    const formObj = Object.fromEntries(new FormData(e.currentTarget));
    const failedConditions = this.validateContactForm(formObj);
    if (failedConditions.length) {
      alert(`Failed conditions: ${failedConditions.map(([field, obj]) => obj.message).join(', ')}`)
      this.drawFormHints(e.currentTarget, failedConditions);
      return false;
    }
    this.submitContactForm(formObj);
  }

  // customElement - contactForm
  async submitContactForm(formObj) {
    const result = await (formObj.id 
      ? this.appState.editContact(formObj) 
      : this.appState.createContact(formObj));
    document.querySelector('#home-button').dispatchEvent(new CustomEvent('click'));
  }

  // customElement - contactForm
  async processTags(tagString) {
    const allTags = await this.appState.getTags();
    const tags = tagString.trim().split(',').map((tag) => tag.trim());
    const lastTag = tags[tags.length - 1];
    const currentTags = hashIterable(tags.slice(0, -1));
    const tagPattern = new RegExp(lastTag, 'i');
    const matches = allTags.filter((tag) => !(tag in currentTags) && tag.match(tagPattern));
    console.log({tagString, lastTag, matches});
    return [tags, matches];
  }

  // customElement - contactForm
  findTag(value) {
    const selector = `.autocomplete-ui-choice[value="${value}"]`;
    console.log(selector, select(selector));
    return select(selector);
  }

  // customElement - contactForm
  highlightMatchingTag(tag) {
    const tagList = selectAll('.autocomplete-ui-choice');
    tagList.forEach((li) => li.classList.remove('highlighted'));
    tag?.classList.add('highlighted');
  }

  // customElement - contactForm
  async handleTagInput(e) {
    const field = select('#tags');
    selectAll('li.autocomplete-ui-choice').forEach((el) => el.remove());
    const { value: tagString } = field;
    if (tagString.length === 0) return;
    const [tags, matches] = await this.processTags(tagString);

    this.appState.setPage({ tagInput: tags, matches, bestMatch: 0 });
    const suggestions = this.templates.contactFormTags;

    select('ul.autocomplete-ui').innerHTML = suggestions({ tags: matches });
    const firstTag = select('.autocomplete-ui-choice');

    this.highlightMatchingTag(firstTag);
  }

  // customElement - contactForm
  handleTagNav(e) {
    const field = select('#tags');
    const tagList = selectAll('.autocomplete-ui-choice');
    const { tagInput, matches, bestMatch } = this.appState.getPage();
    const nextIndex = (i) => i >= matches.length - 1 ? 0 : i + 1;
    const prevIndex = (i) => i <= 0 ? matches.length - 1 : i - 1;
    const selectNew = (i) => {
      this.appState.updatePage({ bestMatch: i });
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

  // custom element - contact form (as draw())
  async drawEditContactForm() {
    const { id } = this.appState.getPage(); // will be passed as an arg
    const contact = await this.appState.findContact(id);
    this.appState.updatePage({ ...contact });
    const tags = await this.appState.getTags();
    if (!contact) {
      alert(`Invalid id: ${id}`);
      document.querySelector('#home-button').dispatchEvent(new MouseEvent('click'));
    }

    this.draw(this.templates.editContact({ contact, tags }));
    this.bindContactFormEvents();
  }
}

export default ((insertionCallback, appState) => new ContactForm(insertionCallback, appState));