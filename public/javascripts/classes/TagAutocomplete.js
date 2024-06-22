import { create, hashIterable } from "../lib/helpers.js";
import Autocomplete from "./Autocomplete.js";

export default class TagAutocomplete extends Autocomplete {
  constructor(input, optionsLoader) {
    super(input, optionsLoader, '(No matching tags)');
    this.backupValue = [];
  }

  matchingOptions(tagValues) {
    const inputTags = this.getInputValue();
    if (!inputTags.length) return null;
    const lastTag = inputTags[inputTags.length - 1];
    const previousTags = hashIterable(inputTags.slice(0, -1));
    const lower = lastTag.toLowerCase();
    return tagValues.filter((option) => 
      !(option in previousTags)
      && option.toLowerCase().startsWith(lower));
  }

  tagStringToArray(tagString) {
    return tagString.split(',').map((tag) => tag.trim());
  }

  tagArrayToString(tagArray) {
    return tagArray.map((tag) => tag.trim()).join(', ');
  }

  // split it into an array
  getInputValue() {
    return this.input.value ? this.tagStringToArray(this.input.value) : [];
  }

  setInputValue(tagArray) {
    if (!Array.isArray(tagArray)) throw new TypeError(`Must pass an array of strings`);
    this.input.value = this.tagArrayToString(tagArray);
  }

  formatInputValue() {
    const current = this.getInputValue();
    const withoutEmpty = current.filter((tag) => tag.length > 0);
    return withoutEmpty;
  }

  appendToInput(string) {
    const current = this.getInputValue();
    this.setInputValue(current.concat([string]));
  }

  newFillValue(option) {
    const tagArr = this.getInputValue();
    const newTagStr = option.textContent;
    const withNewTag = tagArr.slice(0, -1).concat([newTagStr]);
    return withNewTag;
  }

  // remove the last tag and add the option's value
  autofillInputValue(option) {
    this.backupValue = this.getInputValue();
    const newFill = this.newFillValue(option);
    this.setInputValue(newFill.concat(['']));
    const inputSet = new InputEvent('input', { bubbles: true });
    this.input.dispatchEvent(inputSet);
  }

  // prevent consecutive commas and auto insert commas when hitting space
  controlInput(e) {
    const currentTagArray = this.getInputValue();
    const currentValueString = this.input.value;
    console.info({ beforeInputData: e.data, event: e })
    const prevCharIsComma = /,\s*$/.test(currentValueString);
    const improperSpaces = /,(\S|\s{2,})/.test(currentValueString);
    const inputIsSpace = /^\s+$/.test(e.data);
    const isWordInput = /[\w-]+/.test(e.data);
    const isDeletion = /^delete/i.test(e.inputType);

    if (improperSpaces) {
      const corrected = currentValueString.replace(/,(\s{0}|\s{2,})/, ', ');
      this.setInputValue(this.tagStringToArray(corrected));
    }

    if (inputIsSpace) e.preventDefault();

    if (e.inputType === 'insertText') {
      if ((e.data === ',') && prevCharIsComma) {
        e.preventDefault();
      }
      else if (((e.data === ',') || inputIsSpace) && !prevCharIsComma) {
        e.preventDefault();
        this.appendToInput('');
        this.drawOptions();
      }
    } else if (e.inputType === 'deleteContentBackward') {
      e.preventDefault();
      const lastTagEmpty = !currentTagArray[currentTagArray.length - 1];
      const sliceIndex = lastTagEmpty ? -2 : -1;
      const withoutLast = currentTagArray.slice(0, sliceIndex).concat(['']);
      this.setInputValue(withoutLast);
      if (withoutLast.length <= 1) { this.clearUI(); }
      this.dispatchUpdateEvent();
    } else if (e.inputType === 'deleteWordBackward') {
      e.preventDefault();
      this.setInputValue(['']);
      this.clearUI();
      // this.drawOptions();
      // this.dispatchUpdateEvent();
    } 
  }

  drawOverlay(match = null) {
    const suggestedTagArr = this.newFillValue(match ?? this.highlightedOption);
    const textSpan = create('span', { class: 'autocomplete-overlay-text' });
    this.overlay.innerHTML = null;
    this.overlay.append(textSpan);
    this.overlay.style.display = this.overlayDisplayStyle;
    textSpan.textContent = this.tagArrayToString(suggestedTagArr);
  }
}