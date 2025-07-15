// WEB UTILITIES

async function fetchApi(method, url, payload){
  try {
    if(payload){
      const options = {
        method,
        headers: {'content-type':'application/json'},
        body: JSON.stringify(payload)
      }
      const result = await fetch(url, options)
      const data = await result.json()
      return data
    }
    const result = await fetch(url)
    const data = await result.json()
    return data
  } catch(ex) {
    console.error(ex)
    return {error: ex.message}
  }
}

async function getApi(url){
  const result = await fetchApi('get', url)
  return result
}

async function postApi(url, payload){
  const result = await fetchApi('post', url, payload)
  return result
}

async function putApi(url, payload){
  const result = await fetchApi('put', url, payload)
  return result
}

async function deleteApi(url, payload){
  const result = await fetchApi('delete', url, payload)
  return result
}

module.exports = {
  getApi,
  postApi,
  putApi,
  deleteApi
}
