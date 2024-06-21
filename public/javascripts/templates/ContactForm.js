import TagAutocomplete from "../classes/TagAutocomplete.js";
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

class ContactForm extends TemplateWrapper {
  constructor(insertionCallback, appState) {
    super([contactForm, contactFormHint], insertionCallback, appState);
  }

  bindContactFormEvents() {
    select('#contact-form').addEventListener('submit', this.#handleFormSubmit.bind(this));
  }

  async draw(params = undefined) {
    const contact = params?.id ? await this.appState.findContact(params.id) : null;
    super.draw(contact);
    this.bindContactFormEvents();
    // this.#drawTagAutocomplete();
    new TagAutocomplete(select('#contact-form #tags'), this.appState.getTagSet.bind(this.appState));
    select('#full_name').focus();
  }

  #handleFormSubmit(e) {
    // alert(e);
    e.preventDefault();
    const formObj = Object.fromEntries(new FormData(e.currentTarget));
    const formattedFormObj = this.#formatFormValues(formObj);
    const failedConditions = this.#validateContactForm(formattedFormObj);
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
    formatted.tags = formObj.tags.trim().split(',').map((tag) => tag.trim()).filter((tag) => tag.length);
    return formatted;
  }

  // customElement - contactForm
  #validateContactForm(formObj) {
    const phoneNumberPattern = /^(\s*)(\+\d{1,2})?([\s-]?)(\(?)(\d{3})(\)?)[\s-]?(\d{3})[\s-]?(\d{4})\s*$/;
    const emailPattern = /[\w]+@[\w]+\.\w{2,}/;
    const tagPattern = /^\s*[\w-]+\s*$/;
    const { full_name, email, phone_number, tags } = formObj;
    const conditions = {
      'full_name': {
        check: full_name.length > 0,
        message: 'You must provide a name.',
      },
      'email': {
        check: email.length === 0 || emailPattern.test(email),
        message: 'Email must have a name, domain, and @ sign.',
      },
      'phone_number': {
        check: (phone_number.length === 0 || phoneNumberPattern.test(phone_number)),
        message: 'Please enter a valid US phone number.',
      },
      'tags': {
        check: tags.every((tag) => tagPattern.test(tag)),
        message: 'Tags must only contain letters, numbers, underscores, and hyphens',
      }
    };
    const failing = Object.entries(conditions).filter(([key, { check }]) => !check);
    return failing;
  }

  #drawFormHints(form, conditions) {
    this.#resetFormHints(form);

    const hint = this.findTemplate('contactFormHint');
    conditions.forEach(([key, { message }]) => {
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
    await result;
    const navHome = new CustomEvent('appnavigation', { detail: '/' })
    document.dispatchEvent(navHome);
  }
}

export default ((insertionCallback, appState) => new ContactForm(insertionCallback, appState));