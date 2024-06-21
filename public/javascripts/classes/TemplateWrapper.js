import { htmlToElements } from '../lib/helpers.js';

/* A wrapper class for sequences of Handlebars templates that collectively represent a single page. */
export default class TemplateWrapper {
  constructor (templateStrings, insertionCallback, appState) {
    this.templates = [];
    this.insertionCallback = insertionCallback; // e.g., (html) => parentElement.insertAdjacentHTML('beforeend', html)
    this.appState = appState;
    this.templates = []; // templateStrings.map(TemplateWrapper.#createTemplate);
    this.#initHandlebars(templateStrings);
  }

  #initHandlebars(templateStrings) {
    templateStrings.forEach((template) => {
      const script = htmlToElements(template)[0];
      if (script.dataset.templateType === 'partial') {
        Handlebars.registerPartial(script.id, script.innerHTML);
      } else {
        const compiled = Handlebars.compile(script.innerHTML);
        this.templates.push({ id: script.id, compiled });
      }
    });
  }

  // draw the element, passing in relevant state
  draw(elementValues, useHistory = true) {
    const historyState = useHistory ? history.state?.currentPage : {};
    const fullValues = Object.assign({}, elementValues, historyState);
    console.log({fullValues, caller: this});
    for (let i = 0; i < this.templates.length; i += 1) {
      const html = this.templates[i].compiled(fullValues);
      // insert the element into the DOM using the insertion callback
      this.insertionCallback(html);
    }
  }

  findTemplate(name) {
    return this.templates.find(({ id }) => id === name)?.compiled ?? null;
  }
}
