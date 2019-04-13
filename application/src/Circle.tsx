import * as React from "react";
import { Card, Statistic, Image, Transition } from "semantic-ui-react";
import { ICircle } from "./Home";

interface IUretaTotal {
  uretaTotal: number;
}

export default class Circle extends React.Component<ICircle> {
  public readonly state: IUretaTotal;
  public visible: boolean;
  constructor(props: ICircle) {
    super(props);
    this.state = {
      uretaTotal: this.computeTotalUreta(),
    };
    this.visible = true;
  }

  public computeTotalUreta(): number {
    let total: number = 0;
    Promise.all(
      Object.keys(this.props.books).map((value: any) => {
        total += Number(this.props.books[value].ureta);
      })
    );
    return total;
  }

  public async componentWillReceiveProps() {
    this.setState({
      uretaTotal: this.computeTotalUreta(),
    });
  }

  public shouldComponentUpdate(nextProps: ICircle, nextState: IUretaTotal) {
    if (this.state.uretaTotal !== nextState.uretaTotal) {
      this.visible = !this.visible;
      return true;
    }
    return false;
  }

  public render() {
    return (
      <Card link>
        <Image src={this.props.image} />
        <Card.Content>
          <Card.Header>{this.props.name}</Card.Header>
          <Card.Meta>
            <span className="date">{this.props.space}</span>
          </Card.Meta>
          <Card.Meta>
            <p>{this.props.webSite}</p>
          </Card.Meta>
          <Card.Meta>
            <p>{this.props.penName}</p>
          </Card.Meta>
        </Card.Content>
        <Card.Content extra>
          <Statistic.Group widths="1">
            <Statistic color="red">
              <Transition
                visible={this.visible}
                animation="jiggle"
                duration="200"
              >
                <Statistic.Value>{this.state.uretaTotal}</Statistic.Value>
              </Transition>
              <Statistic.Label>URETAYO</Statistic.Label>
            </Statistic>
          </Statistic.Group>
        </Card.Content>
      </Card>
    );
  }
}
