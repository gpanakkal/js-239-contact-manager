import * as helpers from '../lib/helpers.js';

export default class TemplateWrapper {

  constructor (template, insertionCallback, appState) {
    this.templateFunction = Handlebars.compile(template);
    this.insertionCallback = insertionCallback; // e.g., (html) => parentElement.insertAdjacentHTML('beforeend', html)
    this.appState = appState;
  }

  createElements() {
    return helpers.htmlToElements(this.templateFunction({...this.state }));
  }

  draw() {
    // draw the element again, passing in the state
    const html = this.templateFunction({ state: this.state });
    console.log(html);
    // insert the element into the DOM using the insertion callback
    this.insertionCallback(html);
  }
}
