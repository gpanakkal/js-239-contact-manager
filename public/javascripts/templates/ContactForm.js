import Autocomplete from "../classes/Autocomplete.js";
import TemplateWrapper from "../classes/TemplateWrapper.js";
import { hashIterable, select, selectAll } from "../lib/helpers.js";

const contactForm = /* html */ `
<script id="contactForm" type="text/x-handlebars" nonce=''>
  <h2 class='page-header'>
    {{#if contact}}Edit{{else}}Create{{/if}} Contact
  </h2>
  <form id="contact-form">
    <div id="contact-form-grid">
      <input type="hidden" name="id" id="id" value="{{id}}">
      <label for="full_name">Full name:</label>
      <div class="input-box">
        <input type="text" name="full_name" id="full_name" value="{{full_name}}">
      </div>
      <label for="email">Email address:</label>
      <div class="input-box">
        <input type="email" name="email" id="email" value="{{email}}">
      </div>
      <label for="phone_number">Telephone number:</label>
      <div class="input-box">
        <input type="tel" name="phone_number" id="phone_number" value="{{phone_number}}">
      </div>
        <label for="tags">Tags:</label>
        <div class="input-box">
          <input type='text' name='tags' id="tags" value="{{tags}}">
        </div>
      <label></label>
      <button id="contact-form-submit" type="submit" class="btn large">Submit</button>
      <a id="contact-form-cancel" href="/" class="btn large navigation">Cancel</a>
    </div>
  </form>
</script>`;

// const contactFormTags = /* html */ `
// <script id="contactFormTags" type="text/x-handlebars" nonce=''>
//   <ul class="autocomplete-ui">
//     {{#each tags}}
//       <li class="autocomplete-ui-choice" value={{this}}>{{this}}</li>
//     {{/each}}
//   </ul>
// </script>`;

const contactFormHint = /* html */ `
<script id="contactFormHint" type="text/x-handlebars" nonce=''>
  <small class="form-hint">{{message}}</small>
</script>`;

class ContactForm extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([contactForm, contactFormHint], insertionCallback, appState);
  }

  bindContactFormEvents() {
    select('#contact-form').addEventListener('submit', this.handleFormSubmit.bind(this));
  }

  async draw(params = undefined) {
    const contact = params?.id ? await this.appState.findContact(params.id) : null;
    super.draw(contact);
    this.bindContactFormEvents();
    this.drawAutocomplete();
    select('#full_name').focus();
  }

  drawAutocomplete() {
    const tagInput = select('#contact-form #tags');

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

      // return !tags.slice(0, -1).includes(tagValue) && tagValue.includes(lastTag);
    }

    const tagUpdateCb = (input, option) => {
      const previousTagArr = input.value.split(',').map((value) => value.trim()).slice(0, -1);
      const newTagStr = `${option.getAttribute('value')}, `;
      const withNewTag = previousTagArr.concat([newTagStr]).join(', ');
      input.value = withNewTag;
    };

    new Autocomplete(
      tagInput,
      this.appState.getTags.bind(this.appState),
      tagMatcher,
      tagUpdateCb,
    );
  }

  // customElement - contactForm
  drawFormHints(form, conditions) {
    selectAll('.form-hint').forEach((hint) => hint.remove());
    [...form.querySelectorAll('.invalid')]
      .forEach((input) => input.classList.remove('invalid'));
    const hint = this.findTemplate('contactFormHint');
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
    const { full_name, email, phone_number } = formObj;
    const conditions = {
      'full_name': {
        check: full_name.trim().length > 0,
        message: 'You must provide a name.',
      },
      'email': {
        check: email.length === 0 || !!email.match(/[\w]+@[\w]+\.\w{2,}/),
        message: 'Email must have a name, domain, and @ sign.',
      },
      'phone_number': {
        check: (phone_number.length === 0 || !!phone_number.match(phoneNumberPattern)),
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
      // alert(`Failed conditions: ${failedConditions.map(([field, obj]) => obj.message).join(', ')}`)
      this.drawFormHints(e.currentTarget, failedConditions);
      return false;
    }
    this.submitContactForm(formObj);
  }

  async submitContactForm(formObj) {
    const result = await (formObj.id 
      ? this.appState.editContact(formObj) 
      : this.appState.createContact(formObj));
    await result;
    const navHome = new CustomEvent('appnavigation', { detail: '/' })
    document.dispatchEvent(navHome);
  }

  // // customElement - contactForm
  // async processTags(tagString) {
  //   const allTags = await this.appState.getTags();
  //   const tags = tagString.trim().split(',').map((tag) => tag.trim());
  //   const lastTag = tags[tags.length - 1];
  //   const currentTags = hashIterable(tags.slice(0, -1));
  //   const tagPattern = new RegExp(lastTag, 'i');
  //   const matches = allTags.filter((tag) => !(tag in currentTags) && tag.match(tagPattern));
  //   console.log({tagString, lastTag, matches});
  //   return [tags, matches];
  // }

  // customElement - contactForm
  // findTag(value) {
  //   const selector = `.autocomplete-ui-choice[value="${value}"]`;
  //   console.log(selector, select(selector));
  //   return select(selector);
  // }

  // customElement - contactForm
  // highlightMatchingTag(tag) {
  //   const tagList = selectAll('.autocomplete-ui-choice');
  //   tagList.forEach((li) => li.classList.remove('highlighted'));
  //   tag?.classList.add('highlighted');
  // }

  // customElement - contactForm
  // async handleTagInput(e) {
  //   const field = select('#tags');
  //   selectAll('li.autocomplete-ui-choice').forEach((el) => el.remove());
  //   const { value: tagString } = field;
  //   if (tagString.length === 0) return;
  //   // const [tags, matches] = await this.processTags(tagString);

  //   this.appState.setPage({ tagInput: tags, matches, bestMatch: 0 });
  //   const suggestions = this.templates.contactFormTags;

  //   select('ul.autocomplete-ui').innerHTML = suggestions({ tags: matches });
  //   const firstTag = select('.autocomplete-ui-choice');

  //   this.highlightMatchingTag(firstTag);
  // }

  // customElement - contactForm
  // handleTagNav(e) {
  //   const field = select('#tags');
  //   const tagList = selectAll('.autocomplete-ui-choice');
  //   // const { tagInput, matches, bestMatch } = this.appState.;
  //   const nextIndex = (i) => i >= matches.length - 1 ? 0 : i + 1;
  //   const prevIndex = (i) => i <= 0 ? matches.length - 1 : i - 1;
  //   const selectNew = (i) => {
  //     this.appState.updatePage({ bestMatch: i });
  //     this.highlightMatchingTag(this.findTag(matches[i]));
  //   }

  //   const keyActions = {
  //     'ArrowDown': () => {
  //       e.preventDefault();
  //       selectNew(nextIndex(bestMatch));
  //     },
  //     'ArrowUp': () => {
  //       e.preventDefault();
  //       selectNew(prevIndex(bestMatch));
  //     },
  //     'Tab': () => {
  //       if (bestMatch === undefined) return;
  //       e.preventDefault();
  //       // replace the partial tag with the full one
  //       const newTag = this.findTag(bestMatch);
  //       console.log({ bestMatch, newTag })
  //       const newTagString = [...tagInput.slice(0, -1), newTag].join(', ');
  //       field.value = newTagString;
  //       selectNew(null);
  //     },
  //   }

  //   if (e.key in keyActions) {
  //     keyActions[e.key]();
  //   }
  // }

  // temporary
  // async drawEditContactForm() {
  //   const { id } = this.appState. ; // id will be passed as an arg
  //   const contact = await this.appState.findContact(id);
  //   this.appState.updatePage({ ...contact });
  //   const tags = await this.appState.getTags();
  //   if (!contact) {
  //     alert(`Invalid id: ${id}`);
  //     document.querySelector('#home-button').dispatchEvent(new MouseEvent('click'));
  //   }

  //   this.draw(this.templates.editContact({ contact, tags }));
  //   this.bindContactFormEvents();
  // }
}

export default ((insertionCallback, appState) => new ContactForm(insertionCallback, appState));