const xhrRequest = (method, path, headers = {}, data = undefined, responseType = '') => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.open(method, path);
  request.responseType = responseType;

  Object.entries(headers)
    .forEach(([header, value]) => request.setRequestHeader(header, value));

  request.addEventListener('load', (e) => {
    resolve(request.response);
  });

  request.addEventListener('error', (e) => {
    const responseStatus = JSON.stringify({
      status: request.status,
      statusText: request.statusText,
    });
    reject(new Error(responseStatus));
  });

  request.send(data);
});

const contactAPI = {
  async createContact(newContact) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const json = JSON.stringify(newContact);
    return xhrRequest('POST', '/api/contacts', headers, json);
  },

  async editContact(updatedContact) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const json = JSON.stringify(updatedContact);
    return xhrRequest('PUT', `/api/contacts/${updatedContact.id}`, headers, json);
  },

  async fetchContacts() {
    const contactData = await xhrRequest('GET', '/api/contacts', {}, undefined, 'json');
    return contactData;
  },

  async deleteContact(id) {
    try {
      return await xhrRequest('DELETE', `/api/contacts/${id}`, 'json');
    } catch (e) {
      return null;
    }
  },
};

export default contactAPI;
