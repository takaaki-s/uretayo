import * as React from "react";
import { Segment, Dimmer, Loader, Card, Button } from "semantic-ui-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Auth } from "aws-amplify";
import { ICredentials } from "@aws-amplify/core";
import { S3, SQS, DynamoDB } from "aws-sdk";
import Config from "./config";
import MyBook, { IMyBook } from "./MyBook";
import iotSubscribe from "./class/iotSubscrube";

interface IBookList {
  books: [{ [key: string]: IMyBook }] | any[];
  isLoading: boolean;
}

class BookList extends React.Component<RouteComponentProps<any>> {
  public readonly state: IBookList;
  public subscribe: ZenObservable.Subscription | any;
  public s3Client: S3 | any;
  public credentials: ICredentials | any;

  constructor(props: any) {
    super(props);
    this.state = {
      books: [],
      isLoading: true,
    };
  }

  public toAdd = () => {
    this.props.history.push("edit");
  };

  public async refresh() {
    const list = await this.s3Client
      .listObjectsV2({
        Bucket: Config.dataBucket,
        Prefix: `data/${this.credentials.identityId}/book/`
      })
      .promise();

    if (list.Contents) {
      const books: IMyBook = {
        title: "",
        description: "",
        image: "",
        id: "",
        sub: "",
        ureta: 0
      };
      const user = await Auth.currentUserInfo();

      await Promise.all(
        list.Contents.map(async item => {
          if (item.Key !== undefined && item.Key.match(/\.json$/) !== null) {
            const res = await this.s3Client
              .getObject({
                Bucket: Config.dataBucket,
                Key: item.Key
              })
              .promise();
            if (res.Body) {
              const json: IMyBook = JSON.parse(res.Body.toString());
              const db = new DynamoDB({
                apiVersion: "2012-08-10",
                credentials: Auth.essentialCredentials(this.credentials)
              });

              const u = await db
                .getItem({
                  TableName: Config.counterTable,
                  Key: {
                    user_sub: {
                      S: user.attributes.sub
                    },
                    book_id: {
                      S: json.id
                    }
                  }
                })
                .promise();
              json.ureta = 0;
              if (u.Item && u.Item.counter.N) {
                json.ureta = Number(u.Item.counter.N);
              }
              books[json.id] = json;
            }
          }
        })
      );

      this.setState({ books });
    }
  }

  public async componentDidMount() {
    this.credentials = await Auth.currentCredentials();
    this.s3Client = new S3({
      apiVersion: "2006-03-01",
      credentials: Auth.essentialCredentials(this.credentials)
    });

    await this.refresh();

    const user = await Auth.currentUserInfo();

    const cb = (data: any) => {
      this.setState((oldState: IBookList) => {
        oldState.books[data.value.book_id].ureta = data.value.count;
        return oldState;
      });
    };

    this.subscribe = await iotSubscribe(`uretayo/${user.attributes.sub}/+`, cb);

    console.log("subscribed");

    this.setState({ isLoading: false });
  }

  public componentWillUnmount() {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
      console.log("unsubscribe");
    }
  }

  public delBook = async (bookId: string) => {
    const list = await this.s3Client
      .listObjectsV2({
        Bucket: Config.dataBucket,
        Prefix: `data/${this.credentials.identityId}/book/${bookId}`
      })
      .promise();

    if (list.Contents !== undefined) {
      const delKeys = list.Contents.map(v => {
        if (v.Key !== undefined) {
          return { Key: v.Key };
        }
        return { Key: "" };
      });
      await this.s3Client
        .deleteObjects({
          Bucket: Config.dataBucket,
          Delete: {
            Objects: delKeys
          }
        })
        .promise();
      this.refresh();
    }
  };

  public uretayo = async (bookId: string) => {
    const sqs = new SQS({
      apiVersion: "2012-11-05",
      region: Config.region,
      credentials: Auth.essentialCredentials(this.credentials)
    });

    const user = await Auth.currentSession();
    const payload = {
      book_id: this.state.books[bookId].id,
      jwt: user.getIdToken().getJwtToken()
    };

    try {
      await sqs
        .sendMessage({
          MessageBody: JSON.stringify(payload),
          QueueUrl: Config.sqsUrl
        })
        .promise();
    } catch (e) {
      console.log(e);
    }
  };

  public render() {
    return (
      <Segment basic>
        <Segment>
          <Button primary onClick={this.toAdd}>
            追加
          </Button>
        </Segment>
        <Card.Group centered>
          {Object.keys(this.state.books).map((value, i) => {
            if (this.state.books[value].title === undefined) {
              return null;
            }
            return (
              <MyBook
                {...this.state.books[value]}
                delProc={this.delBook}
                uretaProc={this.uretayo}
                key={i}
              />
            );
          })}
        </Card.Group>
        <Dimmer active={this.state.isLoading} inverted>
          <Loader content="Loading" />
        </Dimmer>
      </Segment>
    );
  }
}

export default withRouter(BookList);
