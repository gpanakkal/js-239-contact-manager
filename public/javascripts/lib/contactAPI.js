const xhrRequest = (method, path, headers = {}, data = undefined, responseType = '') => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, path);
    request.responseType = responseType;
  
    Object.entries(headers)
      .forEach(([header, value]) => request.setRequestHeader(header, value));
  
    request.addEventListener('load', (e) => {
      resolve(request.response);
    });
    
    request.addEventListener('error', (e) => {
      reject({ status: xhr.status, statusText: xhr.statusText});
    });

    request.send(data);
  });
};

const contactAPI = {
  async createContact(newContact) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const json = JSON.stringify(newContact);
    return await xhrRequest('POST', '/api/contacts', headers, json);
  },
  
  async editContact(updatedContact) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const json = JSON.stringify(updatedContact);
    return await xhrRequest('PUT', `/api/contacts/${updatedContact.id}`, headers, json);
  },
  
  async fetchContacts() {
    const contactData = await xhrRequest('GET', '/api/contacts', {}, undefined, 'json');
    return contactData;
  },
  
  async deleteContact(id) {
    try {
      return await xhrRequest('DELETE', `/api/contacts/${id}`, 'json');
    } catch(e) {
      console.error(e);
      return null;
    }
  },
}

export default contactAPI;