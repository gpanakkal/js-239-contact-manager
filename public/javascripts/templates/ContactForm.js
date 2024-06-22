import TagAutocomplete from "../classes/TagAutocomplete.js";
import TemplateWrapper from "../classes/TemplateWrapper.js";
import { select, selectAll } from "../lib/helpers.js";

const contactForm = /* html */ `
<script id="contactForm" type="text/x-handlebars" nonce=''>
  <h2 class='page-header'>
    {{#if contact}}Edit{{else}}Create{{/if}} Contact
  </h2>
  <form id='contact-form' data-template-id="contactForm" class="contact-form">
    <div id="contact-form-grid" class='contact-form-grid'>
      <input type="hidden" name="id" id="id" value="{{id}}">
      <label for="full_name">Full name:</label>
      <div class="input-box">
        <input type="text" name="full_name" id="full_name" value="{{full_name}}">
      </div>
      <div></div>
      <label for="email">Email address:</label>
      <div class="input-box">
        <input type="email" name="email" id="email" value="{{email}}">
      </div>
      <div></div>
      <label for="phone_number">Telephone number:</label>
      <div class="input-box">
        <input type="tel" name="phone_number" id="phone_number" value="{{phone_number}}">
      </div>
      <div></div>
        <label for="tags">Tags:</label>
        <div class="input-box">
          <input type='text' name='tags' id="tags" value="{{tags}}">
        </div>
        <div></div>
      <label></label>
      <button id="contact-form-submit" type="submit" class="btn large">Submit</button>
      <a id="contact-form-cancel" href="/" class="btn large navigation">Cancel</a>
      <div></div>
    </div>
  </form>
</script>`;

const contactFormHint = /* html */ `
<script id="contactFormHint" type="text/x-handlebars" nonce=''>
  <small class="form-hint">{{message}}</small>
</script>`;

export default class ContactForm extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([contactForm, contactFormHint], insertionCallback, appState);
  }

  bindContactFormEvents() {
    this.form.addEventListener('submit', this.#handleFormSubmit.bind(this));
  }

  async draw(contact, useHistory) {
    super.draw(contact, useHistory);
    this.form = select('#contact-form');
    this.bindContactFormEvents();
    this.tagAutocomplete = new TagAutocomplete(select('#contact-form #tags'), this.appState.getTagSet.bind(this.appState));
    select('#full_name').focus();
  }

  #handleFormSubmit(e) {
    // alert(e);
    e.preventDefault();
    const formObj = Object.fromEntries(new FormData(e.currentTarget));
    const formattedFormObj = this.#formatFormValues(formObj);
    const failedConditions = this.#validateContactForm(formattedFormObj);
    this.#resetFormHints(e.currentTarget);
    if (failedConditions.length) {
      // alert(`Failed conditions: ${failedConditions.map(([field, obj]) => obj.message).join(', ')}`)
      this.#drawFormHints(e.currentTarget, failedConditions);
      return false;
    }
    this.#submitContactForm(formattedFormObj);
  }

  
  // process tags into csv by taking every instance of '\s*,\s*' and replacing it with ','
  #formatFormValues(formObj) {
    const formatted = { ...formObj };
    formatted.full_name = formObj.full_name.trim();
    // formatted.tags 
    // formatted.tags = formObj.tags.trim().split(',').map((tag) => tag.trim()).filter((tag) => tag.length);
    formatted.tags = this.tagAutocomplete.formatInputValue();
    return formatted;
  }

  // customElement - contactForm
  #validateContactForm(formObj) {
    const namePattern = /^(\s*([\w-]+)(\s+[\w-]+)*\s*)?$/;
    const phoneNumberPattern = /^(\s*)(\+\d{1,2})?([\s-]?)(\(?)(\d{3})(\)?)[\s-]?(\d{3})[\s-]?(\d{4})\s*$/;
    const emailPattern = /[\w]+@[\w]+\.\w{2,}/;
    const tagPattern = /^\s*[\w-]+\s*$/;
    const { full_name, email, phone_number, tags } = formObj;
    const conditions = [
      {
        key: 'full_name',
        check: full_name.length > 0,
        message: 'You must provide a name.',
      },
      {
        key: 'full_name',
        check: namePattern.test(full_name),
        message: 'Name must only contain alphanumeric characters, hyphens and spaces.',
      },
      {
        key: 'email',
        check: email.length === 0 || emailPattern.test(email),
        message: 'Email must have a name, domain, and @ sign.',
      },
      {
        key: 'phone_number',
        check: (phone_number.length === 0 || phoneNumberPattern.test(phone_number)),
        message: 'Please enter a valid US phone number.',
      },
      {
        key: 'tags',
        check: tags.length === 0 || tags.every((tag) => tagPattern.test(tag)),
        message: 'Tags must only contain letters, numbers, underscores, and hyphens',
      },
    ];
    const failing = conditions.filter(({ check }) => !check);
    return failing;
  }

  #drawFormHints(form, conditions) {
    // this.#resetFormHints(form);

    const hint = this.findTemplate('contactFormHint');
    conditions.forEach(({ key, message }) => {
      const location = form.querySelector(`label[for="${key}"]`).nextElementSibling;
      const label = form.querySelector(`label[for="${key}"`);
      location.classList.add('invalid');
      label.classList.add('invalid');
      location.insertAdjacentHTML('beforeend', hint({ message }));
    });
  }

  #resetFormHints(form) {
    selectAll('.form-hint').forEach((hint) => hint.remove());
    [...form.querySelectorAll('.invalid')]
      .forEach((input) => input.classList.remove('invalid'));
  }

  async #submitContactForm(formObj) {
    const result = await (formObj.id 
      ? this.appState.editContact(formObj) 
      : this.appState.createContact(formObj));
    // await result;
    const navHome = new CustomEvent('appnavigation', { detail: '/' });
    document.dispatchEvent(navHome);
  }

  getValues() {
    const templateId = this.form.dataset.templateId;
    const values = super.getValues(templateId);
    values.tags = this.tagAutocomplete.getInputValue();
    return values;
  }
}

// export default ((insertionCallback, appState) => new ContactForm(insertionCallback, appState));