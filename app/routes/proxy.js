import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";  // Importing from your shopify.server.js file
import axios from 'axios';
import https from 'https';

// This function will handle the forwarding of the request
// to its intended destination. For demonstration purposes,
// I'm using a placeholder URL and fetch method.
async function forwardRequest(request) {
  const destinationURL = "https://cat-fact.herokuapp.com/facts/";  // Replace with your actual destination URL

  // Create a new instance of https.Agent to override default settings
  const agent = new https.Agent({  
    rejectUnauthorized: false  // This will bypass the SSL certificate verification
  });

  try {
    const response = await axios(destinationURL, {
      method: request.method,
      httpsAgent: agent,
    });
    /* add Content-Type: application/liquid to the response headers */
    // response.headers['content-type'] = 'application/liquid';
    console.log('Response headers:', response.headers);
    const cats = response.data.map(cat => `${cat.text} {{ shop.name }}, {{ shop.currency }} `);
    return cats;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export const loader = async ({ request }) => {
  // Authenticate the request
  const { session, liquid } = await authenticate.public.appProxy(request);

  // If no session, assume authentication failed
  if (!session) {
    return json({ error: "Authentication failed" }, { status: 401 });
  }

    console.log('Liquid:', liquid);

  // Forward the request to its intended destination
  const response = await forwardRequest(request);

  // Return the response to the storefront
  const responseBody = await response;
  const newHeaders = {
    ...response.headers,
    'content-type': 'application/liquid',
  };
  return json(responseBody, { status: response.status, headers: newHeaders });
};

export async function action({ request }) {
  // Authenticate the request
  const { session, liquid } = await authenticate.public.appProxy(request);


  // If no session, assume authentication failed
  if (!session) {
    return json({ error: "Authentication failed" }, { status: 401 });
  }

  console.log('Liquid:', liquid);

  // Forward the request to its intended destination
  const response = await forwardRequest(request);

  // Return the response to the storefront
  const responseBody = await response;
  const newHeaders = {
    ...response.headers,
    'content-type': 'application/liquid',
  };
  return json(responseBody, { status: response.status, headers: newHeaders });
}