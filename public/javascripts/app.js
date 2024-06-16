import debounce from './debounce.js';
import * as helpers from './helpers.js';
const { select, setBody, xhrRequest } = helpers;

// #endregion

const initTemplates = () => ({
  contactCardPartial: Handlebars
    .registerPartial('contactCardPartial', select('#contactCardPartial').innerHTML),
   manageContactPartial: Handlebars
    .registerPartial('manageContactPartial', select('#manageContactPartial').innerHTML),
  homeActions: Handlebars.compile(select('#homeActions').innerHTML),
  contactList: Handlebars.compile(select('#contactList').innerHTML),
  placeholderText: Handlebars.compile(select('#placeholderText').innerHTML),
  createContact: Handlebars.compile(select('#createContact').innerHTML),
  editContact: Handlebars.compile(select('#editContact').innerHTML),
});

const handleAnchorClick = (e) => {
  e.preventDefault();
  const href = e.target.getAttribute('href');
  console.log(`Navigating to /${href}`);
  history.pushState({}, "", href);
}
document.addEventListener('DOMContentLoaded', async () => {
  const templates = initTemplates();
  
  // fetch contacts
  const contactData = JSON.parse(await xhrRequest('GET', '/api/contacts', { dataType: 'json' }));
  console.table(contactData);

  const pages = {
    home: (contacts) => [templates.homeActions(), templates.contactList({ contacts }), templates.placeholderText()],
    'contacts/new': () => [templates.createContact()],
    'contacts/edit': (contact) => [templates.editContact({ contact })],
  };

  setBody(pages.home(contactData));

  select('a[href="#home"]').addEventListener('click', (e) => {
    handleAnchorClick(e);
    // e.preventDefault();
    // const href = e.target.getAttribute('href');
    setBody(pages.home(contactData));
  });

  select('a[href="#new"]').addEventListener('click', (e) => {
    handleAnchorClick(e);
    // e.preventDefault();
    // const href = e.target.getAttribute('href');
    setBody(pages['contacts/new']());
  });

  select('#contact-name-search').addEventListener('change', (e) => {

  });
});
