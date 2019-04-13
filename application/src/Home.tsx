import * as React from "react";
import { Container, Header, Card } from "semantic-ui-react";

import { Auth } from "aws-amplify";
import { S3, DynamoDB } from "aws-sdk";
import Config from "./config";
import { ICredentials } from "@aws-amplify/core";
import Circle from "./Circle";
import iotSubscribe from './class/iotSubscrube';

interface ICircles {
  circle:
    | [
        {
          [key: string]: ICircle;
        }
      ]
    | any[];
}

export interface ICircle {
  sub: string;
  name: string;
  space: string;
  penName: string;
  webSite: string;
  image: string;
  books:
    | [
        {
          [key: string]: IBook;
        }
      ]
    | any[];
}

export interface IBook {
  title: string;
  description: string;
  image: string;
  id: string;
  ureta: number;
}

export default class Home extends React.Component {
  public subscribe: ZenObservable.Subscription | any;
  public readonly state: ICircles;

  public s3Client: S3 | any;
  public dbClient: DynamoDB | any;

  constructor(props) {
    super(props);
    this.state = {
      circle: []
    };
  }

  public async loadCircleDetail(data: S3.CommonPrefix) {
    const list = await this.s3Client
      .listObjectsV2({
        Bucket: Config.dataBucket,
        Prefix: data.Prefix
      })
      .promise();

    if (!list.Contents) {
      return;
    }

    const circle: ICircle = {
      sub: "",
      name: "",
      space: "",
      penName: "",
      webSite: "",
      image: "",
      books: []
    };
    await Promise.all(
      list.Contents.map(async content => {
        if (
          content.Key === undefined ||
          content.Key.toString().match(/.json$/) === null
        ) {
          return;
        }

        const res = await this.s3Client
          .getObject({
            Bucket: Config.dataBucket,
            Key: content.Key
          })
          .promise();
        if (res.Body) {
          const json = JSON.parse(res.Body.toString());
          if (
            content.Key.toString().match(
              /\/book\/([0-9a-zA-Z\-].*?)\/info.json$/
            ) === null
          ) {
            circle.sub = json.sub;
            circle.name = json.name;
            circle.space = json.space;
            circle.penName = json.penName;
            circle.webSite = json.webSite;
            circle.image = json.image;
          } else {
            const book: IBook = {
              title: json.title,
              description: json.description,
              image: json.image,
              id: json.id,
              ureta: 0
            };
            circle.books[book.id] = book;
          }
        }
      })
    );

    const u = await this.dbClient
      .query({
        TableName: Config.counterTable,
        ExpressionAttributeValues: {
          ":id": {
            S: circle.sub
          }
        },
        KeyConditionExpression: "user_sub = :id"
      })
      .promise();
    if (u.Items) {
      u.Items.forEach(item => {
        if (item.book_id.S && circle.books[item.book_id.S]) {
          circle.books[item.book_id.S].ureta = item.counter.N;
        }
      });
    }

    if (circle.name.length !== 0 ) {
      this.setState((oldState: ICircles) => {
        oldState.circle[circle.sub] = circle;
        return { circle: oldState.circle };
      });
    }
  }

  public async loadCircle() {
    // サークル別のディレクトリを取得する
    const list = await this.s3Client
      .listObjectsV2({
        Bucket: Config.dataBucket,
        Prefix: "data/",
        Delimiter: "/"
      })
      .promise();

    if (list.CommonPrefixes) {
      list.CommonPrefixes.forEach(data => {
        this.loadCircleDetail(data);
      });
    }
  }

  public async componentDidMount() {
    const credentials: ICredentials = await Auth.currentCredentials();
    const essentialCredentials = Auth.essentialCredentials(credentials);
    this.s3Client = new S3({
      apiVersion: "2006-03-01",
      credentials: essentialCredentials
    });
    this.dbClient = new DynamoDB({
      apiVersion: "2012-08-10",
      credentials: essentialCredentials
    });

    await this.loadCircle();

    const cb = (data: any) => {
      this.setState((oldState: ICircles) => {
        if (oldState.circle[data.value.sub] && oldState.circle[data.value.sub].books[data.value.book_id]) {
          oldState.circle[data.value.sub].books[data.value.book_id].ureta =
            data.value.count;
        }
        return oldState;
      });
    };

    this.subscribe = await iotSubscribe("uretayo/+/+", cb);
  }

  public componentWillUnmount() {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
      console.log("unsubscribe");
    }
  }

  public render() {
    return (
      <Container>
        <Header as="h1">サークル一覧</Header>
        <Card.Group>
          {Object.keys(this.state.circle).map((value, i) => {
            return <Circle key={i} {...this.state.circle[value]} />;
          })}
        </Card.Group>
      </Container>
    );
  }
}
