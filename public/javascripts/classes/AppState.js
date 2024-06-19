import contactAPI from "../lib/contactAPI.js";
import localStorageManager from "../lib/localStorageManager.js";

/*
  Manage application state (contacts, tags, maybe page state)
*/
export default class AppState {
  // appState
  static formatContacts(contacts) {
    return contacts.map((contact) => {
      const formatted = {
        phone_number: helpers.formatNumber(contact.phone_number),
        tags: contact.tags?.split(',').join(', '),
      };
      return { ...contact, ...formatted };
    });
  }

  #contacts = null;
  
  constructor() {
    this.storage = localStorageManager;
    this.#fetchContacts();
  }

  async get() {
    const contacts = await this.getContacts();
    console.log({getContacts: contacts})

    return {
      contacts,
    };
  }

  // appState
  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  // AppState
  async getTags() {
    return [...new Set((await this.getContacts()).reduce((str, contact) => {
      if (!contact.tags) return str;
      if (!str) return contact.tags;
      return [str, contact.tags].join(',');
    }, '').split(','))];
  }

  // AppState
  // requires that all CUD operations on contacts correctly update this.#contacts
  async getContacts() {
    if (this.#contacts === null) await this.#fetchContacts();
    return this.#contacts.slice();
  }

  #updateLocalContacts(updatedArr) {
    this.#contacts = updatedArr;
  }

  async #fetchContacts() {
    this.#updateLocalContacts(await contactAPI.fetchContacts());
  }

  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  // convert form data to an object, call the API, and if it succeeds, update the contact locally
  async editContact(updatedContact) {

  }

  async deleteContact(id) {
    const result = await this.contactAPI
  }

  // fetch from localStorage
  getPageState() {
    return this.storage.read('pageState');
  }

  // overwrite page state. Default to this when navigating.
  setPageState(newState) {
    this.storage.replace('pageState', newState);
  }

  // existing state must have the same properties
  updatePageState(updates) {
    this.storage.update('pageState', updates);
    this.setPageState({...this.getPageState(), ...updateVars});
  }

  // reset values, but retain fields
  resetPageState() {
    this.storage.reset('pageState');
  }

}