import * as React from "react";
import {
  Button,
  Dimmer,
  Loader,
  Segment,
  Form,
  Container,
  Image,
  Message
} from "semantic-ui-react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Auth } from "aws-amplify";
import { ICredentials } from "@aws-amplify/core";
import { S3 } from "aws-sdk";
import Config from "./config";
import * as Validator from "validator";

export interface ICircleEdit {
  sub: string;
  name: string;
  space: string;
  penName: string;
  webSite: string;
  image: string;
  newImage: any;
  isLoading: boolean;
  delImage: boolean;
  errorMessage: string[];
}

class CircleEdit extends React.Component<RouteComponentProps> {
  public readonly state: ICircleEdit;
  public dz: any;

  constructor(props: any) {
    super(props);
    this.state = {
      sub: "",
      name: "",
      space: "",
      penName: "",
      webSite: "",
      image: "",
      newImage: null,
      isLoading: true,
      delImage: false,
      errorMessage: []
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
      console.log(e.message);
      return null;
    }
  }

  public async componentDidMount() {
    await this.readInfo();
    this.setState({ isLoading: false });
  }

  public toInfo = () => {
    this.props.history.push("/mypage/");
  };

  public getExt(fileObj: any) {
    switch (fileObj.type) {
      case "image/bmp":
        return "bmp";
      case "image/gif":
        return "gif";
      case "image/jpeg":
      case "image/jpg":
        return "jpg";
      case "image/png":
        return "png";
      default:
        return null;
    }
  }

  public handleChange = (e: any, { name, value, checked }: any) => {
    if (name === "newImage") {
      if (this.getExt(e.target.files[0]) === null) {
        this.setState({ errorMessage: ["画像ファイルを指定してください"] });
        return;
      }

      this.setState({
        image: URL.createObjectURL(e.target.files[0]),
        newImage: e.target.files[0]
      });
      return;
    }

    if (name === "delImage") {
      this.setState({ delImage: checked });
      return;
    }
    this.setState({ [name]: value });
  };

  public save = async () => {
    const json = {
      name: this.state.name,
      space: this.state.space,
      penName: this.state.penName,
      webSite: this.state.webSite,
      image: this.state.image,
      sub: this.state.sub
    };

    const error = Array();

    if (!Validator.isLength(json.name, { max: 200 })) {
      error.push("200文字内で入力してください");
    }
    if (!Validator.isLength(json.space, { max: 200 })) {
      error.push("200文字内で入力してください");
    }

    if (error.length !== 0) {
      this.setState({ errorMessage: error });
      return;
    }
    this.setState({ errorMessage: [] });

    this.setState({ isLoading: true });
    const credentials: ICredentials = await Auth.currentCredentials();
    const s3 = new S3({
      apiVersion: "2006-03-01",
      credentials: Auth.essentialCredentials(credentials)
    });

    try {
      if (this.state.delImage === true) {
        await s3
          .deleteObject({
            Bucket: Config.dataBucket,
            Key:
              `data/${credentials.identityId}/circle.` +
              this.getExt(this.state.newImage)
          })
          .promise();
        json.image = "";
      } else if (this.state.newImage !== null) {
        await s3
          .upload({
            Bucket: Config.dataBucket,
            ACL: "public-read",
            Key:
              `data/${credentials.identityId}/circle.` +
              this.getExt(this.state.newImage),
            Body: this.state.newImage,
            ContentType: this.state.newImage.type
          })
          .promise();
        json.image =
          `https://s3-${Config.region}.amazonaws.com/${
            Config.dataBucket
          }/data/${credentials.identityId}/circle.` +
          this.getExt(this.state.newImage);
      }

      await s3
        .putObject({
          Bucket: Config.dataBucket,
          Key: `data/${credentials.identityId}/info.json`,
          Body: JSON.stringify(json)
        })
        .promise();
      this.props.history.push("/mypage");
    } catch (e) {
      console.log(e);
      this.setState({ isLoading: false });
    }
  };

  public render() {
    return (
      <Segment basic>
        <Dimmer active={this.state.isLoading} inverted>
          <Loader content="Loading" />
        </Dimmer>
        <p>サークル名を空にするとサークル一覧画面に表示されなくなります。</p>
        <Message
          error
          hidden={this.state.errorMessage.length === 0}
          header="エラーがあります"
          list={this.state.errorMessage}
        />

        <Form>
          <Form.Input
            focus
            label="サークル名"
            placeholder="サークル名"
            value={this.state.name}
            name="name"
            onChange={this.handleChange}
          />
          <Form.Input
            label="配置"
            placeholder="配置"
            value={this.state.space}
            name="space"
            onChange={this.handleChange}
          />
          <Form.Input
            label="ペンネーム"
            placeholder="ペンネーム"
            value={this.state.penName}
            name="penName"
            onChange={this.handleChange}
          />
          <Form.Input
            label="Webサイト"
            placeholder="Webサイト"
            value={this.state.webSite}
            name="webSite"
            onChange={this.handleChange}
          />
          <Form.Field>
            <label>サークルイメージ</label>
            <Image size="medium" src={this.state.image} />
          </Form.Field>
          <Segment basic>
            <Form.Input
              type="file"
              name="newImage"
              transparent
              onChange={this.handleChange}
            />
            <Form.Checkbox
              label="サークルイメージを削除する"
              name="delImage"
              onChange={this.handleChange}
            />
          </Segment>
          <Segment>
            <Container textAlign="right">
              <Button onClick={this.toInfo}>キャンセル</Button>
              <Button primary onClick={this.save}>
                保存する
              </Button>
            </Container>
          </Segment>
        </Form>
      </Segment>
    );
  }
}

export default withRouter(CircleEdit);
