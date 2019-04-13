import { CognitoUserPoolEvent, Handler } from "aws-lambda";
import "source-map-support/register";

export const handler: Handler = async (
  event: CognitoUserPoolEvent,
  _context
) => {
  if (event.triggerSource === "PreSignUp_SignUp") {
    event.response.autoConfirmUser = true;
  }
  return event;
};
