import * as React from "react";
import { Card, Button, Image, Statistic, Transition } from "semantic-ui-react";
import { withRouter, RouteComponentProps } from "react-router";

export interface IMyBook {
  title: string;
  description: string;
  image: string;
  id: string;
  sub: string;
  ureta: number;
}

interface IMyBookFunc extends IMyBook {
  delProc(): any;
  uretaProc(): any;
}

interface IMyBookMode extends IMyBookFunc {
  isEdit: boolean;
}

class MyBook extends React.Component<RouteComponentProps<any> & IMyBookFunc> {
  public readonly state: IMyBookMode;
  public visible: boolean;
  constructor(props: any) {
    super(props);
    this.visible = true;
    this.state = Object.assign({}, props, { isEdit: false });
  }

  public toEdit = () => {
    this.props.history.push({
      pathname: "/mypage/book/edit/" + this.props.id
    });
  };

  public shouldComponentUpdate(nextProps, nextState) {
    if (this.props.ureta !== nextProps.ureta) {
      this.visible = !this.visible;
      return true;
    }
    if (this.state.isEdit !== nextState.isEdit) {
      return true;
    }
    return false;
  }

  public handleClick = () => {
    this.setState({ isEdit: !this.state.isEdit });
  };

  public render() {
    const { title, description } = this.props;
    return (
      <Card>
        <Card.Content>
          <Image
            floated="right"
            size="mini"
            src={this.props.image && this.props.image + "?" + Date.now()}
          />

          <Card.Header>
            <Button size="tiny" onClick={this.handleClick} circular icon="edit" />
            {title}
          </Card.Header>
          <Card.Description>{description}</Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Statistic.Group widths="1">
            <Statistic color="red">
              <Transition
                visible={this.visible}
                animation="jiggle"
                duration="200"
              >
                <Statistic.Value>
                  {this.props.ureta
                    .toString()
                    .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}
                </Statistic.Value>
              </Transition>
              <Statistic.Label>URETAYO</Statistic.Label>
            </Statistic>
          </Statistic.Group>
          <br />
          {!this.state.isEdit && (
          <Button
            size="massive"
            fluid
            onClick={this.props.uretaProc.bind(this, this.props.id)}
            color="orange"
          >
            売れた！
          </Button>
          )}
          {this.state.isEdit && (
            <div>
              <Button onClick={this.toEdit}>編集</Button>
              <Button
                negative
                onClick={this.props.delProc.bind(this, this.props.id)}
              >
                削除
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>
    );
  }
}

export default withRouter(MyBook);
