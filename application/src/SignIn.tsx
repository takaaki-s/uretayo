import * as React from "react";
import {
  Button,
  Form,
  Segment,
  Header,
  Divider,
  Grid,
  Container,
  Dimmer,
  Loader,
  Message,
  List
} from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import { withRouter } from "react-router-dom";
import { Auth } from "aws-amplify";

interface IState {
  circleId: string;
  passwd: string;
  isLoading: boolean;
  errorMessage: string[];
}

class MySignIn extends React.Component<any> {
  public readonly state: IState;
  public errorMessage: string | any;

  constructor(props: any) {
    super(props);
    this.redirect = this.redirect.bind(this);
    this.state = {
      circleId: "",
      passwd: "",
      isLoading: false,
      errorMessage: []
    };
  }

  public redirect(path: string) {
    this.props.history.push(path);
  }

  public signIn = async (e: any) => {
    this.setState({ isLoading: true, errorMessage: [] });

    try {
      await Auth.signIn({
        username: this.state.circleId,
        password: this.state.passwd
      });
      this.props.onStateChange("signedIn");
    } catch (e) {
      this.setState({
        isLoading: false,
        isError: true,
        errorMessage: [e.message]
      });
      console.log(e);
    }
  };

  public handleChange = (e: any, { name, value }: any) => {
    this.setState({ [name]: value });
  };

  public toSignUp = (e: any) => {
    this.props.onStateChange("signUp");
  };

  public render() {
    if (this.props.authState !== "signIn") {
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
        <Dimmer active={this.state.isLoading} inverted page>
          <Loader content="Loading" />
        </Dimmer>

        <Grid stackable centered columns={2}>
          <Grid.Column>
            <Segment clearing>
              <Header as="h1" textAlign="center">
                サークルログイン
              </Header>
              <Message
                error
                hidden={this.state.errorMessage.length === 0}
                header="エラーがあります"
                list={this.state.errorMessage}
              />
              <Form>
                <Form.Input
                  value={this.state.circleId}
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
                  value={this.state.passwd}
                  name="passwd"
                  onChange={this.handleChange}
                />
                <Button primary fluid type="submit" onClick={this.signIn}>
                  ログイン
                </Button>
                <Divider />
                <Container textAlign="right">
                  <List>
                    <List.Item as="a" onClick={this.toSignUp}>
                      サークル登録はこちら
                    </List.Item>
                  </List>
                </Container>
              </Form>
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default withRouter(MySignIn);
