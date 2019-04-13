import * as React from "react";
import {
  Button,
  Dimmer,
  Loader,
  Segment,
  Form,
  Container,
  Image
} from "semantic-ui-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Auth } from "aws-amplify";
import { ICredentials } from "@aws-amplify/core";
import { S3 } from "aws-sdk";
import Config from "./config";

export interface ICircleInfo {
  sub: string;
  name: string;
  space: string;
  penName: string;
  webSite: string;
  image: string;
  isLoading: boolean;
}

class CircleInfo extends React.Component<RouteComponentProps> {
  public readonly state: ICircleInfo;
  public dz: any;
  public isError: any;

  constructor(props: any) {
    super(props);
    this.state = {
      sub: "",
      name: "",
      space: "",
      penName: "",
      webSite: "",
      image: "",
      isLoading: true
    };
  }

  public async readInfo() {
    const object = await this.getS3Object("info.json");
    if (object !== null && object.Body !== undefined) {
      this.setState(JSON.parse(object.Body.toString()));
      if (this.state.image === "") {
        this.setState({
          image: "https://via.placeholder.com/350x150"
        });
      } else {
        this.setState({
          image: this.state.image
        });
      }
    }

    const user = await Auth.currentUserInfo();
    this.setState({sub: user.attributes.sub});
  }

  public async getS3Object(objectName: string) {
    const credentials: ICredentials = await Auth.currentCredentials();
    const s3 = new S3({
      apiVersion: "2006-03-01",
      credentials: Auth.essentialCredentials(credentials)
    });

    try {
      const res = await s3
        .getObject({
          Bucket: Config.dataBucket,
          Key: "data/" + credentials.identityId + "/" + objectName
        })
        .promise();
      return res;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async componentDidMount() {
    await this.readInfo();
    this.setState({ isLoading: false });
  }

  public toEdit = () => {
    this.props.history.push("/mypage/edit");
  };

  public render() {
    return (
      <Segment basic>
        <Dimmer active={this.state.isLoading} inverted>
          <Loader content="Loading" />
        </Dimmer>

        <Form>
          <Form.Input
            readOnly
            transparent
            label="サークル名"
            value={this.state.name}
          />
          <Form.Input
            readOnly
            transparent
            label="配置"
            value={this.state.space}
          />
          <Form.Input
            readOnly
            transparent
            label="ペンネーム"
            value={this.state.penName}
          />
          <Form.Input
            readOnly
            transparent
            label="Webサイト"
            value={this.state.webSite}
          />
          <Form.Field>
            <label>サークルイメージ</label>
            <Image size="medium" src={this.state.image && this.state.image + "?" + Date.now()} />
          </Form.Field>
          <Segment>
            <Container textAlign="left">
              <Button onClick={this.toEdit}>編集</Button>
            </Container>
          </Segment>
        </Form>
      </Segment>
    );
  }
}

export default withRouter(CircleInfo);
