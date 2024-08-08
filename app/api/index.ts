import { eventHandler, getRequestURL } from "vinxi/http";

export default eventHandler(async (event) => {
  const url = getRequestURL(event)
  console.log("API ENDPOINT", url)
  if (url.pathname.includes("callback/github")) {
    
  }
  return Response.json({ message: "Hello World" })
});