import { SQSEvent, Handler } from "aws-lambda";
import { DynamoDB, IotData, Firehose } from "aws-sdk";
import jwtChecker from "./jwtChecker";
import "source-map-support/register";

interface ISqsPayload {
  jwt: string;
  book_id: string;
}

export const handler: Handler = async (event: SQSEvent, _context) => {
  const sqsPayload: ISqsPayload = JSON.parse(event.Records[0].body);

  if (sqsPayload.jwt === undefined || sqsPayload.book_id === undefined) {
    return {
      status: 200,
      body: ""
    };
  }

  const jwtPayload = await jwtChecker(sqsPayload.jwt);

  const response = await countUp(jwtPayload.sub, sqsPayload.book_id);
  await publish(
    jwtPayload.sub,
    sqsPayload.book_id,
    Number(response.Attributes.counter.N)
  );

  const payload =
    JSON.stringify({
      sub: jwtPayload.sub,
      book_id: sqsPayload.book_id,
      datetime: event.Records[0].attributes.SentTimestamp
    }) + "\n";

  await putLog(payload);

  return {
    status: 200,
    body: ""
  };
};

async function countUp(sub: string, bookId: string) {
  const db = new DynamoDB({
    apiVersion: "2012-08-10"
  });

  const params: DynamoDB.UpdateItemInput = {
    TableName: process.env.TABLE_NAME,
    ReturnValues: "ALL_NEW",
    Key: {
      [process.env.PRIMARY_KEY]: {
        S: sub
      },
      [process.env.SORT_KEY]: {
        S: bookId
      }
    },
    UpdateExpression: "ADD #count :i",
    ExpressionAttributeNames: { "#count": process.env.COUNTER_COL },
    ExpressionAttributeValues: { ":i": { N: "1" } }
  };

  return db.updateItem(params).promise();
}

async function publish(sub: string, bookId: string, count: number) {
  const iotData = new IotData({
    apiVersion: "2015-05-28",
    endpoint: process.env.IOT_ENDPOINT
  });

  const params: IotData.PublishRequest = {
    topic: `uretayo/${sub}/${bookId}`,
    payload: JSON.stringify({
      count: count,
      book_id: bookId,
      sub: sub
    })
  };
  return iotData.publish(params).promise();
}

async function putLog(payload: string) {
  const params3: Firehose.PutRecordInput = {
    DeliveryStreamName: process.env.DELIVERY_STREAMNAME,
    Record: { Data: new Buffer(payload) }
  };

  const firehose = new Firehose({
    apiVersion: "2015-08-04"
  });
  return firehose.putRecord(params3).promise();
}
