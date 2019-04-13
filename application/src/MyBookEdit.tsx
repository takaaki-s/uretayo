import * as React from "react";
import {
  Segment,
  Form,
  Message,
  Dimmer,
  Loader,
  Container,
  Button,
  Image
} from "semantic-ui-react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import * as Validator from "validator";
import uuid from "uuid/v4";
import Config from "./config";
import { ICredentials } from "@aws-amplify/core";
import { Auth } from "aws-amplify";
import { S3 } from "aws-sdk";

export interface IBookEdit {
  sub: string;
  id: string;
  title: string;
  description: string;
  image: string;
  newImage: any;
  isLoading: boolean;
  delImage: boolean;
  errorMessage: string[];
}

class BookEdit extends React.Component<RouteComponentProps<any>> {
  public readonly state: IBookEdit;
  constructor(props: any) {
    super(props);

    this.state = {
      sub: "",
      id: "",
      title: "",
      description: "",
      image: "",
      newImage: null,
      isLoading: true,
      delImage: false,
      errorMessage: []
    };
  }

  public async componentDidMount() {
    if ("id" in this.props.match.params) {
      const credentials: ICredentials = await Auth.currentCredentials();
      const s3 = new S3({
        apiVersion: "2006-03-01",
        credentials: Auth.essentialCredentials(credentials)
      });

      this.setState({ id: this.props.match.params.id });
      const res = await s3
        .getObject({
          Bucket: Config.dataBucket,
          Key: `data/${credentials.identityId}/book/${
            this.props.match.params.id
          }/info.json`
        })
        .promise();
      if (res.Body) {
        const json = JSON.parse(res.Body.toString());
        this.setState(json);
      }
    }

    const user = await Auth.currentUserInfo();
    this.setState({sub: user.attributes.sub});

    this.setState({ isLoading: false });
  }

  public toInfo = () => {
    this.props.history.push("/mypage/book/");
  };

  public save = async () => {
    this.setState({ isLoading: true });
    const json = {
      title: this.state.title,
      description: this.state.description,
      image: this.state.image,
      id: this.state.id,
      sub: this.state.sub
    };

    const error = Array();

    if (!Validator.isLength(json.title, { min: 1, max: 300 })) {
      error.push("頒布物名は1文字以上300文字内で入力してください");
    }
    if (!Validator.isLength(json.description, { max: 500 })) {
      error.push("説明は500文字内で入力してください");
    }

    if (error.length !== 0) {
      this.setState({ errorMessage: error });
      this.setState({ isLoading: false });
      return;
    }
    this.setState({ errorMessage: [] });

    this.setState({ isLoading: true });
    const credentials: ICredentials = await Auth.currentCredentials();
    const s3 = new S3({
      apiVersion: "2006-03-01",
      credentials: Auth.essentialCredentials(credentials)
    });

    const bookId = this.state.id ? this.state.id : uuid();
    json.id = bookId;

    try {
      if (this.state.delImage === true) {
        await s3
          .deleteObject({
            Bucket: Config.dataBucket,
            Key: `data/${credentials.identityId}/book/${bookId}/book.png`
          })
          .promise();
        json.image = "";
      } else if (this.state.newImage !== null) {
        await s3
          .upload({
            Bucket: Config.dataBucket,
            ACL: "public-read",
            Key:
              `data/${credentials.identityId}/book/${bookId}/book.` +
              this.getExt(this.state.newImage),
            Body: this.state.newImage,
            ContentType: this.state.newImage.type
          })
          .promise();
        json.image =
          `https://s3-${Config.region}.amazonaws.com/${
            Config.dataBucket
          }/data/${credentials.identityId}/book/${bookId}/book.` +
          this.getExt(this.state.newImage);
      }

      await s3
        .putObject({
          Bucket: Config.dataBucket,
          Key: `data/${credentials.identityId}/book/${bookId}/info.json`,
          Body: JSON.stringify(json)
        })
        .promise();
      this.props.history.push("/mypage/book/");
    } catch (e) {
      console.log(e);
      this.setState({ isLoading: false });
    }
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

  public render() {
    return (
      <Segment basic>
        <Dimmer active={this.state.isLoading} inverted>
          <Loader content="Loading" />
        </Dimmer>
        <Message
          error
          hidden={this.state.errorMessage.length === 0}
          header="エラーがあります"
          list={this.state.errorMessage}
        />

        <Form>
          <Form.Input
            required
            focus
            label="頒布物名"
            placeholder="頒布物名"
            value={this.state.title}
            name="title"
            onChange={this.handleChange}
          />
          <Form.TextArea
            label="説明"
            placeholder="説明"
            value={this.state.description}
            name="description"
            onChange={this.handleChange}
          />
          <Form.Field>
            <label>頒布物イメージ</label>
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
              label="頒布物イメージを削除する"
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

export default withRouter(BookEdit);
