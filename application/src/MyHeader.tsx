import * as React from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Menu, Segment } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import { Auth, Hub } from "aws-amplify";

class MyHeader extends React.Component<RouteComponentProps> {
  public readonly state: any;
  constructor(props: RouteComponentProps<any>) {
    super(props);
    this.state = {
      activeItem: "",
      isSignIn: true
    };
    if (this.props.location.pathname.match(/^\/mypage/) !== null) {
      this.state.activeItem = "MyPage";
    }

    Hub.listen("auth", this.authListener);
  }

  public async componentDidMount() {
    try {
      await Auth.currentSession();
      this.setState({ isSignIn: true });
    } catch (e) {
      this.setState({ isSignIn: false });
    }
  }

  public authListener = (data: any) => {
    console.log(data);
    switch (data.payload.event) {
      case "signIn":
        this.setState({ isSignIn: true });
        break;
      case "signOut":
        this.setState({ isSignIn: false });
        break;
    }
  };

  public handleItemClick = async (e: any, d: any) => {
    switch (d.name) {
      case "URETAYO-alpha":
        this.props.history.push("/");
        this.setState({ activeItem: "Uretayo" });
        break;
      case "MyPage":
        this.props.history.push("/mypage/");
        this.setState({ activeItem: "MyPage" });
        break;
      case "SignOut":
        await Auth.signOut();
        break;
      case "SignIn":
        this.props.history.push("/mypage/");
        this.setState({ activeItem: "MyPage" });
        break;
    }
  };

  public signOut = async () => {
    await Auth.signOut();
  };

  public render() {
    return (
      <Segment inverted>
        <Menu inverted pointing secondary>
          <Menu.Item
            header
            name="URETAYO-alpha"
            onClick={this.handleItemClick}
          />
          {this.state.isSignIn && (
            <Menu.Item
              name="MyPage"
              active={this.state.activeItem === "MyPage"}
              onClick={this.handleItemClick}
            />
          )}
          {this.state.isSignIn && (
            <Menu.Item
              hidden
              name="SignOut"
              position="right"
              onClick={this.handleItemClick}
            />
          )}
          {!this.state.isSignIn && (
            <Menu.Item
              hidden
              name="SignIn"
              position="right"
              onClick={this.handleItemClick}
            />
          )}
        </Menu>
      </Segment>
    );
  }
}

export default withRouter(MyHeader);
