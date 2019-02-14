import React from 'react';
import { View, Keyboard, AsyncStorage } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Profile from 'react-native-vector-icons/Ionicons';
import styles from './styles.android';
import { Header, Left, Body, Right, Button, Title, Tab, Tabs,  Badge, Text } from 'native-base';
import Bids from '@containers/exchange-bids/exchange-bids';
import Asks from '@containers/exchange-bids/exchange-bids';
import { connect } from 'react-redux';
import NavigationService from '@services/route';

class Exchange extends React.Component {

  	static navigationOptions = () => ({
        header: null
    });
    
    state = {
        tab: 1
    }

	constructor(props) {
        super(props);
	}

    componentWillMount(){
        Keyboard.dismiss();
		AsyncStorage.getItem('session').then((value) => {
			(value) ? NavigationService.goBackPress('Main') : NavigationService.goBackPress('Start');
			return false;
		});
    }
    
    componentDidMount(){
        if(this.props.socket != 0 || this.props.socket != null){
            setInterval(() => {
                this.props.navigation.setParams({
                    socket: this.props.socket
                })
            }, 5000)
        } else {
            clearInterval();
        }
    }
    
	render() {
		return (
            <View style={styles.container}>
                <Header androidStatusBarColor={"#000"} style={styles.header}>
                    <Left>
                        <Button transparent onPress ={ () => NavigationService.navigate("Main", { menu: true }) }>
                            <Icon name='arrow-back' style={styles.icon_navbar} />
                        </Button>
                    </Left>
                    <Body>
                        <Title style={styles.header_title}>Fridn.Exchange</Title>
                    </Body>
                    <Right>
                        <Button transparent badge onPress={() => NavigationService.navigate("MyExchange", { route: 'Exchange' })}>
                            <Profile name='md-person' style={styles.icon_navbar}/>
                                {
                                    this.props.socket != 0 ? 
                                        <View style={styles.notifier}>
                                            <Badge warning>
                                                <Text style={styles.notifier_title}>{this.props.socket}</Text>
                                            </Badge>
                                        </View> : null
                                }
                        </Button>
                    </Right>
                </Header>
                <Tabs 
                    onChangeTab={({ ref }) => this.setState({ tab: ref.props.heading == "BIDS" ? 1 : 2})}
                    tabBarUnderlineStyle={styles.tab_underline}
                    tabBarInactiveTextColor="#fff"
                    locked
                    scrollWithoutAnimation
                >
                    <Tab tabStyle={styles.tab} activeTabStyle={styles.tab} heading="BIDS">
                        { this.state.tab == 1 ? <Bids type={1}/> : null }
                    </Tab>
                    <Tab tabStyle={styles.tab} activeTabStyle={styles.tab} heading="ASKS">
                        { this.state.tab == 2 ? <Asks type={2}/> : null }  
                    </Tab>
                </Tabs>  
            </View>
		);
	}
}

const mapStateToProps = (state) => ({
	socket: state.socket
});

export default connect(mapStateToProps)(Exchange);
