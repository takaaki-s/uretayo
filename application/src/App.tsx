import * as React from "react";
import "semantic-ui-css/semantic.min.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Amplify from "aws-amplify";
import * as AWS from "aws-sdk";
import MyPage from "./MyPage";
import Home from "./Home";
import Header from "./MyHeader";
import Config from "./config";
import { AWSIoTProvider } from "@aws-amplify/pubsub/lib/Providers";

Amplify.configure({ Auth: Config.Auth });
AWS.config.update({ region: Config.region });

Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: Config.region,
    aws_pubsub_endpoint: `wss://${Config.iotEndpoint}/mqtt`
  })
);

export default class App extends React.Component {
  public render() {
    return (
      <Router>
        <Header />
        <Route exact path="/" component={Home} />
        <Route path="/mypage/" component={MyPage} />
      </Router>
    );
  }
}
