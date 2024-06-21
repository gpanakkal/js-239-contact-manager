import contactAPI from "../lib/contactAPI.js";
import { formatNumber } from "../lib/helpers.js";

/* Caches contacts and interfaces with the API. */
export default class ContactManagerState {
  #contacts = [];

  async getContacts() {
    if (this.#contacts.length === 0) {
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

  async findContact(id) {
    return (await this.getContacts()).find((contact) => String(contact.id) === String(id));
  }

  formatContacts(contacts) {
    return contacts.map((contact) => {
      const formatted = {
        phone_number: formatNumber(contact.phone_number),
      };
      return { ...contact, ...formatted };
    });
  }

  async createContact(newContact) {
    const result = await contactAPI.createContact(newContact);
    if (result) {
      this.#contacts.push(JSON.parse(result));
    }
    return result;
  }

  async editContact(updatedContact) {
    const result = await contactAPI.editContact(updatedContact);
    if (result) {
      const existing = await this.findContact(updatedContact.id);
      const updated = JSON.parse(result);
      Object.assign(existing, updated);
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

  async getTagSet() {
    const contacts = await this.getContacts();
    const allTags = contacts.flatMap((contact) => contact.tags ?? []);
    const uniqueTags = new Set(allTags);
    return uniqueTags;
  }
}