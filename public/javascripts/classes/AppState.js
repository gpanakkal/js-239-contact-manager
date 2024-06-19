import contactAPI from "../lib/contactAPI.js";
import { formatNumber, updateObject } from "../lib/helpers.js";
import LocalStorageManager from "../lib/localStorageManager.js";

/*
  Manage application state (contacts, tags, maybe page state)
*/
export default class AppState {
  #contacts = null;
  
  constructor() {
    const state = {
      contacts: this.#contacts,
      pageState: null,
    };
    this.storage = new LocalStorageManager(state);
    // this.#fetchContacts();
  }

  async get() {
    const contacts = await this.getContacts();
    const pageState = this.getPage();

    return {
      contacts,
      pageState,
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
    if (this.#contacts === null) {
      await this.#fetchContacts();
    }
    return this.#contacts.slice();
  }

  #updateLocalContacts(updatedArr) {
    this.#contacts = updatedArr;
  }

  async #fetchContacts() {
    const fetched = await contactAPI.fetchContacts();
    this.#updateLocalContacts(fetched);
  }

  formatContacts(contacts) {
    return contacts.map((contact) => {
      const formatted = {
        phone_number: formatNumber(contact.phone_number),
        tags: contact.tags?.split(',').join(', '),
      };
      return { ...contact, ...formatted };
    });
  }

  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  // save contact to API and update locally if successful
  async createContact(newContact) {
    const result = await contactAPI.createContact(newContact);
    console.log({createResult: result});
    if (result) {
      this.#contacts.push(newContact);
    }
    return result;
  }

  // save contact to API and update locally if successful
  async editContact(updatedContact) {
    const result = await contactAPI.editContact(updatedContact);
    console.log({editResult: result});
    if (result) {
      const existing = this.findContact(updatedContact.id);
      updateObject(existing, updatedContact);
    }
    return result;
  }

  async deleteContact(id) {
    const deleteResult = await contactAPI.deleteContact(id);
    console.log({deleteResult});
    if (deleteResult !== null) {
      const remaining = this.#contacts.filter((contact) => String(contact.id) !== String(id));
      console.table(remaining)
      this.#updateLocalContacts(remaining);
    }
    return deleteResult;
  }

  // fetch from localStorage
  getPage() {
    return this.storage.read('pageState');
  }

  // overwrite page state. Default to this when navigating.
  setPage(newState) {
    this.storage.replace('pageState', newState);
  }

  // existing state must have the same properties
  updatePage(updates) {
    this.storage.update('pageState', updates);
    this.setPage({...this.getPage(), ...updates});
  }

  // reset values, but retain fields
  resetPage() {
    this.storage.reset('pageState');
  }

}