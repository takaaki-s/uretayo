import { Iot } from "aws-sdk";
import { Auth, PubSub } from "aws-amplify";
import Config from "../config";

const iotSubscribe = async (topic: string, cb: any) => {
  const credentials = await Auth.currentCredentials();

  const iot = new Iot({
    region: Config.region,
    credentials: Auth.essentialCredentials(credentials)
  });
  const policyName = Config.iotPolicyName;
  const target = credentials.identityId;

  const { policies } = await iot.listAttachedPolicies({ target }).promise();
  if (policies && !policies.find(policy => policy.policyName === policyName)) {
    await iot.attachPolicy({ policyName, target }).promise();
  }

  return PubSub.subscribe(topic, {}).subscribe({
    next: cb,
    error: error => console.error(error),
    complete: () => console.log("Done")
  });
};

export default iotSubscribe;
