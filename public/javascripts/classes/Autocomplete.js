import { create, htmlToElements, select, selectAll } from "../lib/helpers.js";

const wrapperTemplate = /* html */ `
<div class="autocomplete-wrapper">
  <div class="autocomplete-input">
  </div>
  <ul class="autocomplete-ui">
  </ul>
  <div class="autocomplete-overlay">
  </div>
</div>
`;

export default class Autocomplete {
  constructor(inputElement, optionsLoader) {
    this.input = inputElement;
    this.optionsLoader = optionsLoader;
    this.highlightedOption = null;
    this.backupValue = '';
    this.wrapper = null;
    this.listUI = null;
    this.overlay = null;

    this.initializeUI();
    this.bindEvents();
  }

  getInputValue() {
    return this.input.value ?? '';
  }

  setInputValue(newFillValue) {
    this.input.value = newFillValue;
  }

  newFillValue(option) {
    return option.textContent;
  }

  initializeUI() {
    this.input.setAttribute('autocomplete', 'off');
    this.inputPlaceholder = this.input.getAttribute('placeholder') ?? '';
    this.wrapper = htmlToElements(wrapperTemplate)[0];
    this.input.insertAdjacentElement('afterend', this.wrapper);
    select('.autocomplete-input', this.wrapper).appendChild(this.input);
    this.listUI = select('ul.autocomplete-ui', this.wrapper);
    this.overlay = select('div.autocomplete-overlay', this.wrapper);

    // copy the input's text dimensions, then remove the overlay's background
    this.overlay.style.width = `${this.input.clientWidth}px`;
    this.listUI.style.top = `${this.input.clientHeight}px`;
    this.overlayDisplayStyle = this.overlay.style.display;
    this.overlay.style.display = 'none';
  }

  bindEvents() {
    this.input.addEventListener('beforeinput', this.controlInput.bind(this));
    this.input.addEventListener('input', this.handleTextInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.listUI.addEventListener('mousedown', this.handleElementSelect.bind(this));
    this.input.addEventListener('focus', this.handleFocusGain.bind(this));
    this.input.addEventListener('blur', this.handleFocusLoss.bind(this));
    this.listUI.addEventListener('mouseover', this.handleMouseover.bind(this));
  }

  // logic for restricting or transforming input
  controlInput(e) {

  }

  // redraw matches as needed
  handleTextInput(e) {
    this.drawOptions();
    this.dispatchUpdateEvent();
  }

  matchingOptions(optionValues) {
    const inputText = this.getInputValue();
    return optionValues.filter((option) => option.toLowerCase().startsWith(inputText.toLowerCase()));
  }

  findListOption(value) {
    const allOptions = selectAll('.autocomplete-ui-choice', this.wrapper)
    return allOptions.find((option) => option.textContent = value);
  }

  async drawOptions() {
    const optionValues = [...await this.optionsLoader()];
    const matches = this.matchingOptions(optionValues);
    this.#drawUI(matches);
  }

  handleKeydown(e) {
    const keyActions = {
      'ArrowDown': (e) => {
        e.preventDefault();
        const next = this.highlightedOption.nextElementSibling ?? this.listUI.firstElementChild;
        this.setBestMatch(next);
        this.highlightMatch();
      },
      'ArrowUp': (e) => {
        e.preventDefault();
        const prev = this.highlightedOption.previousElementSibling ?? this.listUI.lastElementChild;
        this.setBestMatch(prev);
        this.highlightMatch();
      },
      'Tab': (e) => {
        e.preventDefault();
        this.autofillInputValue(this.highlightedOption);
        this.clearUI();
        // this.highlightMatch(null);
      },
      'Escape': (e) => {
        this.restoreBackupValue();
      },
      'Enter': (e) => {
        this.clearUI();
      }, // this permits form submit since it doesn't prevent default
    }
    
    if (e.key in keyActions) {
      if (!this.UIVisible()) return;
      keyActions[e.key](e);
    }
  }

  autofillInputValue() {
    this.backupValue = this.getInputValue();
    this.setInputValue(this.newFillValue(this.highlightedOption));
    const inputSet = new InputEvent('input', { bubbles: true });
    this.input.dispatchEvent(inputSet);
  }

  dispatchUpdateEvent() {
    const updateEvent = new CustomEvent('autocomplete-updated');
    this.input.dispatchEvent(updateEvent);
  }

  restoreBackupValue() {
    if (this.backupValue === null) return null;
    this.setInputValue(this.backupValue);
    this.dispatchUpdateEvent();
    // const inputModifiedEvent = new CustomEvent('autocomplete-reverted');
    // this.input.dispatchEvent(inputModifiedEvent);
    this.resetUI();
  }

  // dispatchRestoreEvent() {

  // }

  handleElementSelect(e) {
    if (!e.target.classList.contains('autocomplete-ui-choice')) return;
    e.preventDefault();
    const match = e.target;
    this.setInputValue(this.newFillValue(match));
    this.resetUI();
    this.input.focus({ focusVisible: true });
  }

  handleFocusGain(e) {
    // this.drawOptions();
    this.input.setAttribute('placeholder', '');
  }

  handleFocusLoss(e) {
    this.clearUI();
    this.input.setAttribute('placeholder', this.inputPlaceholder);
  }

  handleMouseover(e) {
    const match = e.target;
    if (e.target.classList.contains('autocomplete-ui-choice')) {
      this.setBestMatch(match);
      this.highlightMatch();
      this.drawOverlay();
    }
  }

  setBestMatch(match) {
    this.highlightedOption = match;
  }

  // dual purpose: sets the match and highlights the current match. split it up
  highlightMatch() {
    const optionList = selectAll('.autocomplete-ui-choice', this.listUI);
    optionList.forEach((li) => li.classList.remove('highlighted'));
    this.highlightedOption.classList.add('highlighted');
  }

  matchListItems(options) {
    return options.map((option) => {
      return create('li', { class: "autocomplete-ui-choice" }, { textContent: option });
    });
  }

  async #drawUI(optionValues) {
    this.resetUI();
    // const options = optionValues?.filter((option) => option !== this.getInputValue()) ?? [];
    const options = optionValues ?? [];
    this.listUI.setAttribute('visible', 'true');

    if (options.length) {
      this.#drawMatchingList(options);
      // const listItems = this.matchListItems(options);
      // listItems.forEach((li) => this.listUI.appendChild(li));
      // this.setBestMatch(listItems[0]);
      // this.highlightMatch();
    } else {
      const noItemsLi = this.matchListItems(['(No matching options)'])[0];
      noItemsLi.className = 'autocomplete-no-options';
      this.listUI.appendChild(noItemsLi);
    }
  }

  UIVisible() {
    return this.listUI.getAttribute('visible') === 'true';
  }

  #drawMatchingList(options) {
    const listItems = this.matchListItems(options);
    listItems.forEach((li) => this.listUI.appendChild(li));
    this.setBestMatch(listItems[0]);
    this.highlightMatch();
  }

  drawOverlay(match = null) {
    const newText = this.newFillValue(match ?? this.highlightedOption);
    const textSpan = create('span', { class: 'autocomplete-overlay-text' });
    this.overlay.innerHTML = null;
    this.overlay.append(textSpan);
    this.overlay.style.display = this.overlayDisplayStyle;
    textSpan.textContent = newText;
  }

  resetOverlay() {
    this.overlay.textContent = '';
    this.overlay.style.display = 'none';
  }

  clearUI() {
    this.resetUI();
    // const uiClearedEvent = new CustomEvent('autocomplete-reverted');
    this.input.dispatchUpdateEvent();
  }

  resetUI() {
    this.highlightedOption = null;
    this.listUI.innerHTML = null;
    this.resetOverlay();
    this.listUI.setAttribute('visible', 'false');
  }
}