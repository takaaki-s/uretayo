import * as React from "react";
import { withAuthenticator } from "aws-amplify-react";
import { Container, Menu } from "semantic-ui-react";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import MyCircleInfo from "./MyCircleInfo";
import MyCircleEdit from "./MyCircleEdit";
import MyBookList from "./MyBookList";
import MyBookEdit from "./MyBookEdit";
import { Route, RouteComponentProps, withRouter } from "react-router-dom";

class MyPage extends React.Component<RouteComponentProps<any>> {
  public readonly state: any;
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = {
      activeItem: "circle"
    };
    if (props.location.pathname.match(/^\/mypage\/book/) !== null) {
      this.state = {
        activeItem: "book"
      };
    }
  }

  public handleClick = (e: any, d: any) => {
    switch (d.name) {
      case "サークル情報":
        this.setState({ activeItem: "circle" });
        this.props.history.push("/mypage/");
        break;
      case "頒布物":
        this.setState({ activeItem: "book" });
        this.props.history.push("/mypage/book/");
        break;
    }
  };

  public render() {
    console.log(this.props,this.state);
    return (
      <Container>
        <Menu secondary>
          <Menu.Item
            name="サークル情報"
            active={this.state.activeItem === "circle"}
            onClick={this.handleClick}
          />
          <Menu.Item
            name="頒布物"
            active={this.state.activeItem === "book"}
            onClick={this.handleClick}
          />
        </Menu>
        <Route exact path="/mypage/" component={MyCircleInfo} />
        <Route path="/mypage/edit/" component={MyCircleEdit} />
        <Route exact path="/mypage/book/" component={MyBookList} />
        <Route path="/mypage/book/edit/:id" component={MyBookEdit} />
        <Route exact path="/mypage/book/edit/" component={MyBookEdit} />
      </Container>
    );
  }
}

export default withAuthenticator(withRouter(MyPage), true, [
  <SignIn />,
  <SignUp />
]);
