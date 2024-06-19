import * as helpers from '../lib/helpers.js';

export default class TemplateWrapper {

  constructor (templateStrings, insertionCallback, appState) {
    this.templates = [];
    this.insertionCallback = insertionCallback; // e.g., (html) => parentElement.insertAdjacentHTML('beforeend', html)
    this.appState = appState;
    this.createTemplates(templateStrings);
  }

  createTemplates(templateStrings) {
    this.templates = templateStrings.map((str) => {
      const script = helpers.htmlToElements(str)[0];
      console.log({str, script})
      return Handlebars.compile(script.innerHTML);
    });
  }

  draw(state) {
    // draw the element again, passing in the state
    for (let i = 0; i < this.templates.length; i += 1) {
      const html = this.templates[i]({ state });
      console.log(html); // temporary
      // insert the element into the DOM using the insertion callback
      this.insertionCallback(html);
    }
  }
}
