import * as React from "react";
import {
  Button,
  Form,
  Segment,
  Header,
  Divider,
  Grid,
  Container,
  List,
  Dimmer,
  Loader,
  Message,
  Modal
} from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import { withRouter } from "react-router-dom";
import { Auth } from "aws-amplify";

interface IState {
  circleId: string;
  passwd: string;
  passwd2: string;
  isLoading: boolean;
  errorMessage: string[];
  isComplete: boolean;
}

class SignUp extends React.Component<any> {
  public readonly state: IState;
  public errorTitle: string | any;
  public errorMessage: string | any;

  constructor(props: any) {
    super(props);

    this.state = {
      circleId: "",
      passwd: "",
      passwd2: "",
      isLoading: false,
      errorMessage: [],
      isComplete: false
    };
  }

  public redirect(path: string) {
    this.props.history.push(path);
  }

  public toSignIn = (e: any) => {
    this.props.onStateChange("signIn");
  };

  public handleChange = (e: any, { name, value }: any) => {
    this.setState({ [name]: value });
  };

  public signUp = async () => {
    this.setState({ isLoading: true, errorMessage: [] });
    if (this.state.passwd !== this.state.passwd2) {
      this.setState({
        errorMessage: ["パスワードが一致しません"],
        isLoading: false
      });
      return;
    }
    try {
      await Auth.signUp({
        username: this.state.circleId,
        password: this.state.passwd
      });
      this.setState({ isLoading: false, isComplete: true });
    } catch (e) {
      this.setState({
        isLoading: false,
        isError: true,
        errorMessage: [e.message]
      });
      console.log(e);
    }
  };

  public close = () => {
    this.props.onStateChange("signIn");
  };

  public render() {
    if (this.props.authState !== "signUp") {
      return null;
    }
    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        <Dimmer active={this.state.isLoading} inverted>
          <Loader content="Loading" />
        </Dimmer>

        <Grid stackable centered columns={2}>
          <Grid.Column>
            <Segment clearing>
              <Header as="h1" textAlign="center">
                サークル登録
              </Header>
              <Message
                error
                hidden={this.state.errorMessage.length === 0}
                header="エラーがあります"
                list={this.state.errorMessage}
              />
              <Form>
                <Form.Input
                  label="サークルID"
                  type="text"
                  required
                  name="circleId"
                  onChange={this.handleChange}
                  focus
                />
                <Form.Input
                  label="パスワード"
                  type="password"
                  required
                  name="passwd"
                  onChange={this.handleChange}
                />
                <Form.Input
                  label="パスワード再入力"
                  type="password"
                  required
                  name="passwd2"
                  onChange={this.handleChange}
                />
                <Button primary fluid type="submit" onClick={this.signUp}>
                  登録
                </Button>
                <Divider />
                <Container textAlign="right">
                  <List>
                    <List.Item as="a" onClick={this.toSignIn}>
                      サークルログインに戻る
                    </List.Item>
                  </List>
                </Container>
              </Form>
            </Segment>
            <Modal
              size="mini"
              open={this.state.isComplete}
              onClose={this.close}
            >
              <Modal.Header>サークル登録が完了しました</Modal.Header>
              <Modal.Content>
                <p>ログイン画面からログインしてください</p>
              </Modal.Content>
              <Modal.Actions>
                <Button primary content="閉じる" onClick={this.close} />
              </Modal.Actions>
            </Modal>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default withRouter(SignUp);
