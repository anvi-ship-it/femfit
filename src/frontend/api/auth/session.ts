import type { IncomingMessage, ServerResponse } from "node:http";
import { deleteSession, getSession } from "../../server/twilio-auth.js";

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method === "DELETE") {
    return deleteSession(request, response);
  }
  return getSession(request, response);
}
