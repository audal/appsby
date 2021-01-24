import postSearch from './handlers/handle-search';
import postView from './handlers/handle-document';
import postAuth from './handlers/handle-auth';
import postAPI from './handlers/handle-api';
import postUpload  from './handlers/handle-upload';
import postUploadMIME from './handlers/handle-upload-mime'
import postUploadComplete from './handlers/handle-upload-complete'
import {S3Callback} from './handlers/handle-s3-callback';
import {v4 as uuidv4} from 'uuid';
import {parseDomain, ParseResultType} from "parse-domain";


// Map your functions to http events here
const RESOURCE_MAP = {
      'search': {POST: postSearch},
      'view': {POST: postView},
      'auth': {POST: postAuth},
      'api': {POST: postAPI},
      'upload': {POST: postUpload},
      'mime': {POST: postUploadMIME},
      'postupload': {POST: postUploadComplete}
    }
;

/*
  BOILERPLATE STARTS HERE
  Usually you don't have to touch anything below this.
  (unless you are using this for actual production app and need to use Cognito & SNS & such)
  */


// eslint-disable-next-line import/prefer-default-export
export async function resolve(event) {

  return Promise.resolve()
      .then(() => {
        if (event.httpMethod && event.resource) {
          // eslint-disable-next-line no-param-reassign

          let resourceName = event.requestContext.path.replace("/", "");

          let resource = RESOURCE_MAP[resourceName];
          let resourceMethod = resource && resource[event.httpMethod];
          let rejectBasedOnHeaderOrigin = true;
          if (!resourceMethod) {
            //If it's not pointing to a normal resource, try adding the webhooks
            let webHook = global.appsbyWebhooks.find(x => x.endpoint === resourceName);
            if (!webHook || event.httpMethod === "GET") {
              return Promise.reject(new Error('[404] Route Not Found'));
            }
            rejectBasedOnHeaderOrigin = false;
            resourceMethod = webHook.handler
          }

          if (rejectBasedOnHeaderOrigin && process.env.websiteAddress) {
            let originalDomain = event.headers.origin.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
            let parseResult = parseDomain(originalDomain);
            let parseResultGuarantee = parseDomain(process.env.websiteAddress)
            if (parseResult.type === ParseResultType.Listed) {
              const {icann} = parseResult;
              let icannGuarantee = parseResultGuarantee.icann;
              let origin = icann.domain + "." + icann.topLevelDomains.join(".")
              let originGuarantee = icannGuarantee.domain  + "." + icannGuarantee.topLevelDomains.join(".")
              if (origin !== originGuarantee) {
                return Promise.reject(new Error('[401] Outside domain'));
              }
            } else if (process.env.NODE_ENV === "development") {
              if(originalDomain.includes("localhost")) { process.env.websiteAddress = "localhost" } else {
                process.env.websiteAddress = originalDomain;
              }
            } else {
              return Promise.reject(new Error('[401] Outside domain'));
            }

          }

          if (event.resource === "logout") {
            return
          }

          return resourceMethod(event);
        } else if (event.records) {
          return S3Callback(event);
        }
        console.log('UNKNOWN EVENT', event);
        return {};
      })
      .then(res => {

        if (event.httpMethod === "GET"){
          sendProxySuccessRedirect.bind()
        }
        else {
          if (event.resource === "logout"){
            sendProxyLogout.bind();
          } else {
            sendProxySuccess.bind()
          }
        }

        if (event.httpMethod === "GET") {
          sendProxyErrorDynamicPage.bind() } else { sendProxyError.bind() }
      }); // eslint-disable-line
}

const sendProxySuccessRedirect = (responseObj) => {
  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 301,
    headers: {
      Location: responseObj,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  return response;
};

const sendProxySuccess = (responseObj) => {

  let u = uuidv4();
  let cookieHeader;

  console.log(responseObj);


  if (typeof responseObj.token === "string") {
    cookieHeader = [`_appsbyToken=${responseObj.token}; Domain=${process.env.websiteAddress}; Max-Age=900; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
    responseObj.token = u;
  } else if (typeof responseObj === "string") {
    cookieHeader = [`_appsbyToken=${responseObj}; Domain=${process.env.websiteAddress}; Max-Age=900; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
    responseObj = u;
  }

  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 200,
    body: JSON.stringify(responseObj),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  if(cookieHeader) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxyLogout = () => {

  let u = uuidv4();
  let cookieHeader = [`_appsbyToken=${u}; Expires=; Domain=${process.env.websiteAddress}; Max-Age=0; expires=Sat, 1-Jan-72 00:00:00 GMT; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]

  const response =  {
    statusCode: 200,
    body: {},
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  if(cookieHeader) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxyError = (err) => {
  console.log('ERROR:', err.stack || err);
  let status = 500;
  let message = err.message || JSON.stringify(err);
  const m = err.message && err.message.match(/^\[(\d+)\] *(.*)$/);
  if (m) {
    [, status, message] = m;
  }
  const response = {
    statusCode: status,
    body: JSON.stringify({ errorMessage: message }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };

  let u = uuidv4();
  let cookieHeader = [`_appsbyToken=${u}; Expires=; Domain=${process.env.websiteAddress}; Max-Age=0; expires=Sat, 1-Jan-72 00:00:00 GMT; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
  if(status === 401) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxySuccessDynamicPage = (responseObj) => {
  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 200,
    body: responseObj,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};

const sendProxyErrorDynamicPage = (err) => {
  console.log('ERROR:', err.stack || err);
  let status = 500;
  let message = err.message || JSON.stringify(err);
  const m = err.message && err.message.match(/^\[(\d+)\] *(.*)$/);
  if (m) {
    [, status, message] = m;
  }
  const response = {
    statusCode: status,
    body: `<html lang="en"><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Error 404</title>
  </head>
  <body>
    <main class="border-multicolor">
      <div class="container-lg d-flex flex-column">
        <div class="row align-items-center justify-content-center min-vh-100 py-10 py-md-12 mt-n1">
          <div class="col-12 col-md-7 col-lg-5 text-center">
            <h1 class="display-3 mb-4">
              Uh oh - Code ${status}.
            </h1>
            <p class="text-muted">
              ${message}
            </p>
            <small>Powered by <a href="http://audallabs.com">Appsby.js</a></small>
          </div>
        </div>
      </div>
    </main>
</body></html>`,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};
